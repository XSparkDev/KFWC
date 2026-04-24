-- KFWC registrations table (new flow ends after "Get App")
create extension if not exists pgcrypto;

create table if not exists public.kfwc_registrants (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null default (
    'KFWC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6))
  ),
  xs_user_id text,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone_number text,
  organisation text,
  registration_complete boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_kfwc_registrants_created_at
  on public.kfwc_registrants (created_at desc);

create index if not exists idx_kfwc_registrants_email
  on public.kfwc_registrants (lower(email));

alter table public.kfwc_registrants enable row level security;

-- Registration page uses anon key, so allow inserts.
drop policy if exists "kfwc_registrants_insert_anon" on public.kfwc_registrants;
create policy "kfwc_registrants_insert_anon"
on public.kfwc_registrants
for insert
to anon, authenticated
with check (true);

-- Admin dashboard reads rows when signed in.
drop policy if exists "kfwc_registrants_select_authenticated" on public.kfwc_registrants;
create policy "kfwc_registrants_select_authenticated"
on public.kfwc_registrants
for select
to authenticated
using (true);
