-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ========================================
-- TABLES
-- ========================================

create table public.users (
  id              uuid default uuid_generate_v4() primary key,
  steam_id        text unique not null,
  username        text not null,
  avatar_url      text,
  steam_profile_url text,
  reputation      integer default 0,
  created_at      timestamp with time zone default now()
);

create table public.hides (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id) on delete cascade not null,
  title           text not null,
  description     text,
  map             text not null,
  difficulty      text not null check (difficulty in ('Easy', 'Medium', 'Hard', 'Impossible')),
  category        text not null check (category in (
    'Best Hide', 'Best Camouflage', 'Funniest Hide', 'Best Beginner Hide', 'Impossible Hide'
  )),
  screenshot_url  text not null,
  video_url       text,
  votes           integer default 0,
  created_at      timestamp with time zone default now()
);

create table public.votes (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id) on delete cascade not null,
  hide_id         uuid references public.hides(id) on delete cascade not null,
  created_at      timestamp with time zone default now()
);

-- IMMUTABLE helper: converts timestamptz → UTC date
-- Required because timestamptz::date is STABLE (timezone-dependent), not IMMUTABLE
create or replace function utc_date(ts timestamptz)
returns date language sql immutable as $$
  select (ts at time zone 'UTC')::date;
$$;

-- One vote per user per hide per calendar day (UTC)
create unique index votes_daily_unique
  on public.votes(user_id, hide_id, utc_date(created_at));

create table public.comments (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id) on delete cascade not null,
  hide_id         uuid references public.hides(id) on delete cascade not null,
  content         text not null check (char_length(content) <= 500),
  created_at      timestamp with time zone default now()
);

create table public.awards (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id) on delete cascade not null,
  hide_id         uuid references public.hides(id) on delete cascade not null,
  award_type      text not null,
  week            integer not null,
  year            integer not null,
  created_at      timestamp with time zone default now()
);

-- ========================================
-- INDEXES
-- ========================================

create index on public.hides(user_id);
create index on public.hides(created_at desc);
create index on public.hides(votes desc);
create index on public.votes(hide_id);
create index on public.votes(user_id);
create index on public.comments(hide_id);
create index on public.awards(week, year);

-- ========================================
-- RPC FUNCTIONS (for atomic vote counting)
-- ========================================

create or replace function increment_votes(hide_id uuid)
returns void language sql security definer as $$
  update public.hides set votes = votes + 1 where id = hide_id;
$$;

create or replace function decrement_votes(hide_id uuid)
returns void language sql security definer as $$
  update public.hides set votes = greatest(votes - 1, 0) where id = hide_id;
$$;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

alter table public.users   enable row level security;
alter table public.hides   enable row level security;
alter table public.votes   enable row level security;
alter table public.comments enable row level security;
alter table public.awards  enable row level security;

-- Public read access for all tables
create policy "public_read_users"    on public.users    for select using (true);
create policy "public_read_hides"    on public.hides    for select using (true);
create policy "public_read_votes"    on public.votes    for select using (true);
create policy "public_read_comments" on public.comments for select using (true);
create policy "public_read_awards"   on public.awards   for select using (true);

-- Service role full access (used by the Next.js API routes)
create policy "service_all_users"    on public.users    for all using (auth.role() = 'service_role');
create policy "service_all_hides"    on public.hides    for all using (auth.role() = 'service_role');
create policy "service_all_votes"    on public.votes    for all using (auth.role() = 'service_role');
create policy "service_all_comments" on public.comments for all using (auth.role() = 'service_role');
create policy "service_all_awards"   on public.awards   for all using (auth.role() = 'service_role');

-- ========================================
-- STORAGE BUCKET  (run in Supabase dashboard or via API)
-- ========================================
-- create bucket screenshots with public access enabled.
-- Storage → New bucket → name: screenshots → Public: true
