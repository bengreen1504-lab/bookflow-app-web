-- BookFlow core schema
-- Two-sided marketplace: customers book services from businesses; business owners
-- manage services, staff, bookings, POS sales, and see a CRM/analytics view of their customers.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'business_owner');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text not null,
  email text not null,
  push_notifications boolean not null default true,
  email_reminders boolean not null default true,
  promotional_offers boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles are updatable by owner" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
create type public.business_category as enum ('barbers', 'salons', 'cleaners', 'car_detailing');

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category public.business_category not null default 'barbers',
  address text not null default '',
  hours text not null default '',
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

create policy "businesses are publicly readable" on public.businesses
  for select using (true);

create policy "businesses are manageable by owner" on public.businesses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  duration_minutes integer not null default 30,
  price_cents integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;

create policy "services are publicly readable" on public.services
  for select using (true);

create policy "services are manageable by business owner" on public.services
  for all using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- staff
-- ---------------------------------------------------------------------------
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  role text not null default 'Staff',
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

create policy "staff are manageable by business owner" on public.staff
  for all using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- bookings + booking_services (a booking can bundle multiple services)
-- ---------------------------------------------------------------------------
create type public.booking_status as enum ('upcoming', 'completed', 'cancelled');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  booking_date date not null,
  booking_time text not null,
  status public.booking_status not null default 'upcoming',
  payment_status public.payment_status not null default 'unpaid',
  total_price_cents integer not null default 0,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create table public.booking_services (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  name_snapshot text not null,
  price_cents_snapshot integer not null,
  duration_minutes_snapshot integer not null
);

alter table public.bookings enable row level security;
alter table public.booking_services enable row level security;

create policy "customers see their own bookings" on public.bookings
  for select using (auth.uid() = customer_id);

create policy "business owners see their business bookings" on public.bookings
  for select using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

-- Now that bookings exists, allow business owners to read the profile of any
-- customer who has booked with them (needed for the Clients/CRM view and booking lists).
create policy "profiles are readable by businesses they booked with" on public.profiles
  for select using (
    exists (
      select 1 from public.bookings b
      join public.businesses biz on biz.id = b.business_id
      where b.customer_id = profiles.id and biz.owner_id = auth.uid()
    )
  );

create policy "customers create their own bookings" on public.bookings
  for insert with check (auth.uid() = customer_id);

create policy "customers cancel their own bookings" on public.bookings
  for update using (auth.uid() = customer_id) with check (auth.uid() = customer_id);

create policy "business owners update their business bookings" on public.bookings
  for update using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

create policy "booking_services follow booking access - select" on public.booking_services
  for select using (
    exists (
      select 1 from public.bookings bk
      left join public.businesses b on b.id = bk.business_id
      where bk.id = booking_id and (bk.customer_id = auth.uid() or b.owner_id = auth.uid())
    )
  );

create policy "booking_services follow booking access - insert" on public.booking_services
  for insert with check (
    exists (
      select 1 from public.bookings bk
      where bk.id = booking_id and bk.customer_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- POS sales (in-person checkout rung up by the business)
-- ---------------------------------------------------------------------------
create type public.pos_method as enum ('tap', 'reader', 'cash');

create table public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  method public.pos_method not null default 'tap',
  total_cents integer not null default 0,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create table public.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  pos_sale_id uuid not null references public.pos_sales (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  name_snapshot text not null,
  price_cents_snapshot integer not null,
  qty integer not null default 1
);

alter table public.pos_sales enable row level security;
alter table public.pos_sale_items enable row level security;

create policy "pos_sales are manageable by business owner" on public.pos_sales
  for all using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

create policy "pos_sale_items follow sale access" on public.pos_sale_items
  for all using (
    exists (
      select 1 from public.pos_sales s
      join public.businesses b on b.id = s.business_id
      where s.id = pos_sale_id and b.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.pos_sales s
      join public.businesses b on b.id = s.business_id
      where s.id = pos_sale_id and b.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "reviews are publicly readable" on public.reviews
  for select using (true);

create policy "customers write their own reviews" on public.reviews
  for insert with check (auth.uid() = customer_id);

create policy "customers update their own reviews" on public.reviews
  for update using (auth.uid() = customer_id) with check (auth.uid() = customer_id);

-- ---------------------------------------------------------------------------
-- messages (simple per-business chat thread)
-- ---------------------------------------------------------------------------
create type public.message_sender as enum ('customer', 'business');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  sender public.message_sender not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages are readable by participants" on public.messages
  for select using (
    auth.uid() = customer_id
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

create policy "messages are insertable by participants" on public.messages
  for insert with check (
    auth.uid() = customer_id
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  target_type text,
  target_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications are readable by owner" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications are updatable by owner" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- CRM view: per-business client stats derived from bookings
-- ---------------------------------------------------------------------------
create view public.business_clients as
select
  b.business_id,
  b.customer_id,
  p.full_name,
  p.email,
  p.promotional_offers as marketing_opt_in,
  count(*) filter (where b.status <> 'cancelled') as visits,
  coalesce(sum(b.total_price_cents) filter (where b.payment_status = 'paid'), 0) as lifetime_spend_cents,
  max(b.booking_date) as last_visit
from public.bookings b
join public.profiles p on p.id = b.customer_id
group by b.business_id, b.customer_id, p.full_name, p.email, p.promotional_offers;

alter view public.business_clients set (security_invoker = on);

-- realtime: let business owners subscribe to new bookings live
-- Supabase projects already ship a `supabase_realtime` publication; this guard
-- only exists so the same migration also runs against a plain local Postgres.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
