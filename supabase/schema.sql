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

-- Weekly archive: stores each week's top hide and best player before reset
create table public.archives (
  id              uuid default uuid_generate_v4() primary key,
  week            integer not null,
  year            integer not null,
  category        text not null check (category in ('hide', 'player')),
  hide_id         uuid references public.hides(id) on delete set null,
  user_id         uuid references public.users(id) on delete set null,
  votes           integer not null default 0,
  created_at      timestamp with time zone default now(),
  unique (week, year, category)
);

-- Steam Workshop map submissions (status: pending → approved/rejected by admin)
create table public.map_submissions (
  id                uuid default uuid_generate_v4() primary key,
  user_id           uuid references public.users(id) on delete cascade not null,
  map_name          text not null,
  steam_workshop_url text not null,
  workshop_id       text not null,
  description       text,
  screenshot_url    text,
  preview_image_url text,
  status            text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  votes             integer not null default 0,
  created_at        timestamp with time zone default now(),
  unique (workshop_id)
);

-- Tracks who upvoted which map (one vote per user per map)
create table public.map_votes (
  id        uuid default uuid_generate_v4() primary key,
  user_id   uuid references public.users(id) on delete cascade not null,
  map_id    uuid references public.map_submissions(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique (user_id, map_id)
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
create index on public.archives(year, week desc);
create index on public.archives(category);
create index on public.map_submissions(status);
create index on public.map_submissions(votes desc);
create index on public.map_submissions(user_id);
create index on public.map_votes(map_id);
create index on public.map_votes(user_id);

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

create or replace function increment_map_votes(map_id uuid)
returns void language sql security definer as $$
  update public.map_submissions set votes = votes + 1 where id = map_id;
$$;

create or replace function decrement_map_votes(map_id uuid)
returns void language sql security definer as $$
  update public.map_submissions set votes = greatest(votes - 1, 0) where id = map_id;
$$;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

alter table public.users   enable row level security;
alter table public.hides   enable row level security;
alter table public.votes   enable row level security;
alter table public.comments enable row level security;
alter table public.awards    enable row level security;
alter table public.archives       enable row level security;
alter table public.map_submissions enable row level security;
alter table public.map_votes       enable row level security;

-- Public read access for all tables
create policy "public_read_users"    on public.users    for select using (true);
create policy "public_read_hides"    on public.hides    for select using (true);
create policy "public_read_votes"    on public.votes    for select using (true);
create policy "public_read_comments" on public.comments for select using (true);
create policy "public_read_awards"    on public.awards    for select using (true);
create policy "public_read_archives"  on public.archives  for select using (true);

-- Service role full access (used by the Next.js API routes)
create policy "service_all_users"    on public.users    for all using (auth.role() = 'service_role');
create policy "service_all_hides"    on public.hides    for all using (auth.role() = 'service_role');
create policy "service_all_votes"    on public.votes    for all using (auth.role() = 'service_role');
create policy "service_all_comments" on public.comments for all using (auth.role() = 'service_role');
create policy "service_all_awards"    on public.awards    for all using (auth.role() = 'service_role');
create policy "service_all_archives"       on public.archives       for all using (auth.role() = 'service_role');
-- Maps: public can only see approved; service_role manages everything
create policy "public_read_approved_maps"  on public.map_submissions for select using (status = 'approved');
create policy "service_all_map_submissions" on public.map_submissions for all using (auth.role() = 'service_role');
create policy "public_read_map_votes"      on public.map_votes       for select using (true);
create policy "service_all_map_votes"      on public.map_votes       for all using (auth.role() = 'service_role');

-- ========================================
-- STORAGE BUCKET  (run in Supabase dashboard or via API)
-- ========================================
-- create bucket screenshots with public access enabled.
-- Storage → New bucket → name: screenshots → Public: true
