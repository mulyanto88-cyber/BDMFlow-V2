-- ============================================================
-- 000_base_schema.sql
-- The tables 001 assumes already exist.
--
-- 001_plan_and_trial.sql opens with `alter table public.profiles`, which fails
-- outright on a fresh project. This creates the two tables the app reads, plus
-- the trigger that gives every new signup a profile row — without it a user can
-- register successfully and then have no plan, no trial and no watchlist.
--
-- Run this FIRST, then 001. Dashboard → SQL Editor → New query.
-- Safe to re-run: every statement is guarded.
-- ============================================================

-- 1. profiles ------------------------------------------------------------------
-- One row per account, keyed by the Supabase auth user. `plan`, `trial_ends_at`
-- and `plan_since` are added by 001; they are deliberately not defined here so
-- entitlement stays in one file.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now()
);

-- 2. Create a profile whenever an account is created ---------------------------
-- security definer because the trigger runs in the auth schema's context and
-- must write through the RLS policies that 001 puts on profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    -- Supabase stores whatever the signup form sent; both keys are common.
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  )
  on conflict (id) do nothing;   -- re-runs and retries must not fail signup
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. watchlists ----------------------------------------------------------------
-- The unique pair is required, not decorative: the API upserts with
-- `onConflict: 'user_id,stock_code'`, which errors without a matching
-- constraint. See src/app/api/watchlist/route.ts.
create table if not exists public.watchlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  stock_code  text not null,
  alert_score numeric,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (user_id, stock_code)
);

create index if not exists watchlists_user_idx on public.watchlists (user_id);

-- 4. Backfill accounts that predate this trigger -------------------------------
-- A no-op on a fresh project; matters if anyone signed up before it existed.
insert into public.profiles (id, email)
select u.id, u.email
  from auth.users u
  left join public.profiles p on p.id = u.id
 where p.id is null;

-- ── Next ──────────────────────────────────────────────────────────────────────
-- Run 001_plan_and_trial.sql, which adds plan/trial columns, the 7-day trial
-- trigger, and the row-level security policies for both tables.
