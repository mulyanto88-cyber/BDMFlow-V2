-- ============================================================
-- 003_user_activity.sql
-- User & Guest Activity Logging for Admin Analytics
--
-- Run this in Supabase Dashboard -> SQL Editor.
-- Safe to re-run.
-- ============================================================

-- 1. Create table for user & guest page-view activities
create table if not exists public.user_activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  guest_id    text,
  path        text not null,
  page_title  text,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Ensure user_id can be null for anonymous / guest visitors
alter table public.user_activities alter column user_id drop not null;
alter table public.user_activities add column if not exists guest_id text;

-- 2. Indexes for fast queries by user, guest, timestamp, and path
create index if not exists user_activities_user_idx on public.user_activities (user_id, created_at desc);
create index if not exists user_activities_guest_idx on public.user_activities (guest_id, created_at desc);
create index if not exists user_activities_created_idx on public.user_activities (created_at desc);
create index if not exists user_activities_path_idx on public.user_activities (path);

-- 3. Row Level Security (RLS)
alter table public.user_activities enable row level security;

-- Policy: Allow inserts from authenticated users and guest visitors
drop policy if exists "user_activities_insert_own" on public.user_activities;
drop policy if exists "user_activities_insert_all" on public.user_activities;
create policy "user_activities_insert_all"
  on public.user_activities for insert
  with check (true);

-- Note on SELECT:
-- NO public SELECT policy is created. This ensures visitors CANNOT read
-- activity logs of anyone.
-- Only the Admin (via Service Role API or Supabase SQL Editor) can view the logs.
