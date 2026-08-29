-- ============================================================
-- 001_plan_and_trial.sql
-- Server-side entitlement: the plan and trial window must live on the account,
-- not in the browser. The old 7-day trial was kept in localStorage, so clearing
-- site data granted an unlimited supply of fresh trials.
--
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: every statement is guarded.
-- ============================================================

-- 1. Columns on profiles ------------------------------------------------------
alter table public.profiles
  add column if not exists plan          text        not null default 'free',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists plan_since    timestamptz;

-- Only these two values are meaningful to the app.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_plan_check'
  ) then
    alter table public.profiles
      add constraint profiles_plan_check check (plan in ('free', 'pro'));
  end if;
end $$;

create index if not exists profiles_plan_idx on public.profiles (plan);

-- 2. Give every new signup a 7-day trial, once ---------------------------------
-- Existing rows are backfilled below; new rows get it at insert time.
create or replace function public.set_initial_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.trial_ends_at is null then
    new.trial_ends_at := now() + interval '7 days';
  end if;
  return new;
end $$;

drop trigger if exists profiles_set_initial_trial on public.profiles;
create trigger profiles_set_initial_trial
  before insert on public.profiles
  for each row execute function public.set_initial_trial();

-- Backfill accounts that predate the trial column.
update public.profiles
   set trial_ends_at = now() + interval '7 days'
 where trial_ends_at is null;

-- 3. Row Level Security -------------------------------------------------------
-- A user may read their own profile but must never write plan/trial themselves;
-- those are set by the service role (payment webhook) only.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own_safe" on public.profiles;
create policy "profiles_update_own_safe"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and plan is not distinct from (select p.plan from public.profiles p where p.id = auth.uid())
    and trial_ends_at is not distinct from (select p.trial_ends_at from public.profiles p where p.id = auth.uid())
  );

-- 4. Watchlists stay owner-scoped ---------------------------------------------
alter table public.watchlists enable row level security;

drop policy if exists "watchlists_own" on public.watchlists;
create policy "watchlists_own"
  on public.watchlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── After running this ────────────────────────────────────────────────────────
-- Grant yourself Pro for testing:
--   update public.profiles set plan = 'pro', plan_since = now()
--    where id = (select id from auth.users where email = 'you@example.com');
--
-- Then set ENFORCE_PRO_GATING=true in the app environment to switch the paywall on.
