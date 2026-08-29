-- ============================================================
-- 002_billing.sql
-- Subscription billing: expiration window + gateway ledger.
--
-- Run this AFTER 000_base_schema.sql and 001_plan_and_trial.sql.
-- Dashboard → SQL Editor → New query. Safe to re-run.
--
-- Design notes:
--   * profiles.plan_expires_at turns `plan = 'pro'` into a window.
--     A pro row with NULL expiry (legacy manual grant) stays active —
--     see isPlanActive in src/lib/billing.ts.
--   * billing_invoices maps a gateway invoice (external_id) to a user,
--     so the webhook never has to trust payer identity from the payload.
--   * billing_webhooks is the idempotency ledger: one row per gateway
--     event id (PK), so a retried callback can't double-extend a plan.
--   * Both tables are service-role only: no RLS policies for clients.
-- ============================================================

-- 1. Subscription window on profiles ------------------------------------------
alter table public.profiles
  add column if not exists plan_expires_at  timestamptz,
  add column if not exists plan_activated_at timestamptz;

-- 2. Invoices created by our checkout endpoint ----------------------------------
create table if not exists public.billing_invoices (
  external_id        text primary key,               -- our id, sent to the gateway
  user_id            uuid not null references auth.users (id) on delete cascade,
  gateway_invoice_id text,                           -- gateway's own id, once known
  amount             integer not null,               -- IDR
  status             text not null default 'PENDING',-- PENDING | PAID | EXPIRED | FAILED
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);

create index if not exists billing_invoices_user_idx on public.billing_invoices (user_id);

-- 3. Gateway webhook ledger (idempotency) ---------------------------------------
create table if not exists public.billing_webhooks (
  event_id    text primary key,                      -- gateway event id
  status      text not null,
  external_id text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

alter table public.billing_invoices enable row level security;
alter table public.billing_webhooks enable row level security;

-- No policies on purpose: both tables are read/written only via the
-- service-role key from the server routes (checkout / webhook).

-- 4. Atomic subscription grant (called by the webhook via RPC) -----------------
-- Stacks on top of an active window; starts from now otherwise.
-- Lives in SQL so a retried callback can never double-extend the window.
create or replace function public.grant_pro_subscription(p_user_id uuid, p_months int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set plan             = 'pro',
         plan_since       = coalesce(plan_since, now()),
         plan_activated_at = now(),
         plan_expires_at  = (
           case
             when plan_expires_at is null or plan_expires_at < now()
               then now() + make_interval(months => p_months)
             else plan_expires_at + make_interval(months => p_months)
           end
         )
   where id = p_user_id;
$$;

revoke all on function public.grant_pro_subscription(uuid, int) from public;
revoke all on function public.grant_pro_subscription(uuid, int) from anon;

-- ── After running this ────────────────────────────────────────────────────────
-- Test grant (replace email):
--   update public.profiles
--      set plan = 'pro', plan_expires_at = now() + interval '1 month',
--          plan_activated_at = now()
--    where id = (select id from auth.users where email = 'you@example.com');
