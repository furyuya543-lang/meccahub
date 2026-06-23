-- MeccaHub Supabase Schema
-- Run this in your Supabase SQL editor

-- Users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  steam_id text unique not null,
  username text not null,
  avatar_url text default '',
  steam_profile_url text default '',
  reputation integer default 0,
  created_at timestamptz default now()
);

-- Hides table
create table if not exists public.hides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text default '',
  map text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard', 'Impossible')),
  category text not null check (category in ('Best Hide', 'Best Camouflage', 'Funniest Hide', 'Best Beginner Hide', 'Impossible Hide')),
  screenshot_url text default '',
  video_url text,
  votes integer default 0,
  created_at timestamptz default now()
);

-- Votes table (one per user per hide per day enforced in app)
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  hide_id uuid not null references public.hides(id) on delete cascade,
  created_at timestamptz default now()
);

-- Comments table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  hide_id uuid not null references public.hides(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Awards table
create table if not exists public.awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  hide_id uuid not null references public.hides(id) on delete cascade,
  award_type text not null,
  week integer not null,
  year integer not null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists hides_user_id_idx on public.hides(user_id);
create index if not exists hides_votes_idx on public.hides(votes desc);
create index if not exists hides_created_at_idx on public.hides(created_at desc);
create index if not exists votes_hide_id_idx on public.votes(hide_id);
create index if not exists votes_user_hide_idx on public.votes(user_id, hide_id, created_at);
create index if not exists comments_hide_id_idx on public.comments(hide_id);
create index if not exists awards_week_year_idx on public.awards(week, year);

-- RPC to safely increment votes
create or replace function increment_votes(hide_id uuid)
returns void
language sql
security definer
as $$
  update public.hides set votes = votes + 1 where id = hide_id;
$$;

-- Row Level Security
alter table public.users enable row level security;
alter table public.hides enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.awards enable row level security;

-- Policies: read-all, service-role-write
create policy "Users are publicly readable" on public.users for select using (true);
create policy "Hides are publicly readable" on public.hides for select using (true);
create policy "Votes are publicly readable" on public.votes for select using (true);
create policy "Comments are publicly readable" on public.comments for select using (true);
create policy "Awards are publicly readable" on public.awards for select using (true);

-- Allow service role to do everything (used by NextAuth sign-in callback)
create policy "Service role full access users" on public.users for all using (auth.role() = 'service_role');
create policy "Service role full access hides" on public.hides for all using (auth.role() = 'service_role');
create policy "Service role full access votes" on public.votes for all using (auth.role() = 'service_role');
create policy "Service role full access comments" on public.comments for all using (auth.role() = 'service_role');
create policy "Service role full access awards" on public.awards for all using (auth.role() = 'service_role');

-- Storage bucket for screenshots (create via dashboard or CLI)
-- insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', true);
