-- Admin authority: server-only. Users cannot grant themselves admin.
create table admin_users (
  user_id uuid primary key references profiles(id) on delete cascade,
  created_at timestamptz default now()
);
alter table admin_users enable row level security;

-- No public policies on admin_users. Only service_role (Edge Functions) reads it.

create or replace function is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from admin_users where user_id = uid);
$$;

-- Tighten products: public read approved only (already), sellers own drafts.
-- Admin writes go through Edge Function with service_role, bypassing RLS safely.
