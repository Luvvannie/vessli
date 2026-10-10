-- Vessli MVP schema - Postgres (SQL) - S3 for files, Supabase for Auth+DB
-- Money in kobo integers. Statuses match PRD.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  store_name text not null,
  bio text,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references seller_profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  price_kobo integer not null check (price_kobo > 0),
  currency text not null default 'NGN',
  cover_s3_key text,
  status text not null default 'pending_review' check (status in ('draft','pending_review','approved','rejected','archived')),
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  approved_at timestamptz
);
create index idx_products_status on products(status);

create table product_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  s3_key text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id),
  seller_id uuid not null references seller_profiles(id),
  total_kobo integer not null check (total_kobo > 0),
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending','paid','failed','abandoned')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  unit_price_kobo integer not null,
  quantity integer not null default 1 check (quantity = 1)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade unique,
  provider text not null default 'paystack',
  provider_reference text not null unique,
  amount_kobo integer not null,
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending','verified','failed')),
  verified_at timestamptz,
  created_at timestamptz default now()
);

create table commission_ledger (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  seller_id uuid not null references seller_profiles(id),
  gross_kobo integer not null,
  commission_rate numeric(5,4) not null default 0.1000,
  commission_kobo integer not null,
  seller_net_kobo integer not null,
  status text not null default 'recorded' check (status in ('recorded','reversed')),
  created_at timestamptz default now()
);

create table download_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  buyer_id uuid not null references profiles(id),
  created_at timestamptz default now()
);

-- RLS on
alter table profiles enable row level security;
alter table seller_profiles enable row level security;
alter table products enable row level security;
alter table product_files enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table commission_ledger enable row level security;
alter table download_events enable row level security;

-- Public can read approved products only. Sellers manage own. Orders/payments locked down (Edge Functions use service_role).
create policy "public approved products" on products for select using (status = 'approved');
create policy "sellers own products" on products for all using (
  seller_id in (select id from seller_profiles where user_id = auth.uid())
);
