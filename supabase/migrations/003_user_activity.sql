-- ============================================================
-- 003_user_activity.sql
-- User Activity Logging for Admin Analytics & User Tracking
--
-- Run this in Supabase Dashboard -> SQL Editor.
-- Safe to re-run.
-- ============================================================

-- 1. Create table for user page-view and feature activities
create table if not exists public.user_activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  path        text not null,
  page_title  text,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- 2. Indexes for fast queries by user and by timestamp
create index if not exists user_activities_user_idx on public.user_activities (user_id, created_at desc);
create index if not exists user_activities_created_idx on public.user_activities (created_at desc);
create index if not exists user_activities_path_idx on public.user_activities (path);

-- 3. Row Level Security (RLS)
alter table public.user_activities enable row level security;

-- Policy: Users can only insert their own activities (cannot spoof other users)
drop policy if exists "user_activities_insert_own" on public.user_activities;
create policy "user_activities_insert_own"
  on public.user_activities for insert
  with check (auth.uid() = user_id);

-- Note on SELECT:
-- NO public SELECT policy is created. This ensures regular users CANNOT read
-- activity logs of any user (including their own or others).
-- Only the Admin (via Service Role API or Supabase SQL Editor) can view the logs.
