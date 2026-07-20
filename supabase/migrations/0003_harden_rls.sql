-- Hardens RLS gaps found in a security review before going live: several
-- policies correctly scoped *which row* a user could touch by ownership, but
-- not *which values* they could write — since the app also exposes a plain
-- anon-key browser client, RLS (not the Server Actions) is the real boundary
-- against a caller who skips the app UI and calls the Supabase REST API
-- directly with a valid session.

-- ---------------------------------------------------------------------------
-- bookings: a customer could otherwise insert/update their own booking with
-- payment_status='paid' directly, bypassing Stripe entirely. The app itself
-- never inserts a booking client-side (only the Stripe webhook does, via the
-- service-role client, which bypasses RLS) and cancelBookingAction only ever
-- sets status='cancelled' — so restrict both policies to match exactly what
-- the app actually needs and nothing more.
-- ---------------------------------------------------------------------------
drop policy if exists "customers create their own bookings" on public.bookings;
create policy "customers create their own bookings" on public.bookings
  for insert with check (
    auth.uid() = customer_id
    and payment_status = 'unpaid'
    and stripe_payment_intent_id is null
  );

-- The "using" clause still lets a customer target their own row; a trigger
-- (below) enforces that a customer-initiated update may only flip status to
-- 'cancelled' and cannot touch payment fields. A plain RLS "with check"
-- can't compare against the pre-update row, so this needs a trigger rather
-- than a policy — business-owner and service-role updates are unaffected
-- since the trigger only fires its restriction when auth.uid() = customer_id.
create or replace function public.guard_customer_booking_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.customer_id then
    if new.status is distinct from 'cancelled'
       or new.payment_status is distinct from old.payment_status
       or new.total_price_cents is distinct from old.total_price_cents
       or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
       or new.business_id is distinct from old.business_id
    then
      raise exception 'Customers may only cancel their own booking, not modify payment or price fields.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_customer_booking_update on public.bookings;
create trigger guard_customer_booking_update
  before update on public.bookings
  for each row execute procedure public.guard_customer_booking_update();

-- Belt-and-suspenders: a paid/cancelled booking should never revert to
-- unpaid, and a stripe_payment_intent_id, once set, should never change —
-- catches any future write path (not just the customer's) that tries.
create or replace function public.guard_booking_payment_immutable()
returns trigger
language plpgsql
as $$
begin
  if old.stripe_payment_intent_id is not null
     and new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
  then
    raise exception 'stripe_payment_intent_id cannot be changed once set.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_booking_payment_immutable on public.bookings;
create trigger guard_booking_payment_immutable
  before update on public.bookings
  for each row execute procedure public.guard_booking_payment_immutable();

-- Prevent double-selling the same slot: two non-cancelled bookings for the
-- same business at the same date/time can no longer both exist. A conflict
-- here means the second payment succeeded but the booking couldn't be
-- written — see the webhook's exception handling for that case.
create unique index if not exists bookings_no_double_booking
  on public.bookings (business_id, booking_date, booking_time)
  where status <> 'cancelled';

-- Stripe redelivers events at-least-once; without this, a redelivered
-- payment_intent.succeeded (network retry, slow handler) could otherwise
-- insert a second booking or POS sale for the same payment.
create unique index if not exists bookings_stripe_payment_intent_id_key
  on public.bookings (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create unique index if not exists pos_sales_stripe_payment_intent_id_key
  on public.pos_sales (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- ---------------------------------------------------------------------------
-- reviews: nothing previously checked that the reviewer actually had a
-- completed booking with that business — any signed-in customer could post
-- a review for any business with no transaction history at all.
-- ---------------------------------------------------------------------------
drop policy if exists "customers write their own reviews" on public.reviews;
create policy "customers write their own reviews" on public.reviews
  for insert with check (
    auth.uid() = customer_id
    and booking_id is not null
    and exists (
      select 1 from public.bookings bk
      where bk.id = booking_id
        and bk.customer_id = auth.uid()
        and bk.business_id = reviews.business_id
        and bk.status = 'completed'
    )
  );

-- ---------------------------------------------------------------------------
-- messages: the insert policy allowed the request through if the caller was
-- *either* the customer or the business owner on the thread, but never tied
-- that to the `sender` value being inserted — a customer could insert a row
-- with sender='business' (or vice versa), forging who appears to have sent
-- it in the counterparty's chat view.
-- ---------------------------------------------------------------------------
drop policy if exists "messages are insertable by participants" on public.messages;
create policy "messages are insertable by participants" on public.messages
  for insert with check (
    (sender = 'customer' and auth.uid() = customer_id)
    or (
      sender = 'business'
      and exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- profiles: role wasn't excluded from the owner's own update policy, so any
-- signed-in customer could set their own role to 'business_owner' directly
-- (skipping /onboarding's business-creation step, though real business
-- privileges stay scoped to businesses.owner_id regardless — this closes the
-- gap anyway since role also drives dashboard vs. app routing).
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_role_immutable()
returns trigger
language plpgsql
as $$
begin
  -- Only blocks a regular authenticated session changing its own role (the
  -- self-escalation this closes). auth.uid() is null for the service-role
  -- client, so a legitimate admin/backoffice role change made server-side
  -- still goes through.
  if auth.uid() is not null and new.role is distinct from old.role then
    raise exception 'role cannot be changed after signup.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_immutable on public.profiles;
create trigger guard_profile_role_immutable
  before update on public.profiles
  for each row execute procedure public.guard_profile_role_immutable();

-- ---------------------------------------------------------------------------
-- businesses: nothing stopped a double-submitted /onboarding form (or a
-- direct API call) from giving one owner two business rows, which would
-- then break requireBusiness()'s .maybeSingle() call (errors on >1 row) and
-- strand that owner bouncing between /onboarding and /dashboard.
-- ---------------------------------------------------------------------------
alter table public.businesses add constraint businesses_owner_id_key unique (owner_id);
