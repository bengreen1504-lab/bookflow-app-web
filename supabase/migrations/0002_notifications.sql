-- Server-side notification triggers. Notifications have no INSERT policy for
-- regular users (see 0001), so they can only ever be created by these
-- SECURITY DEFINER functions, never spoofed by a client.

create or replace function public.notify_on_booking_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  biz_name text;
begin
  select name into biz_name from public.businesses where id = new.business_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, title, body, target_type, target_id)
    values (
      new.customer_id,
      'Booking Confirmed',
      biz_name || ' · ' || new.booking_date || ' ' || new.booking_time,
      'booking',
      new.id
    );
  elsif tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' then
    insert into public.notifications (user_id, title, body, target_type, target_id)
    values (
      new.customer_id,
      'Booking Cancelled',
      biz_name || ' · ' || new.booking_date || ' ' || new.booking_time,
      'booking',
      new.id
    );
  end if;

  return new;
end;
$$;

create trigger on_booking_change
  after insert or update on public.bookings
  for each row execute procedure public.notify_on_booking_change();

create or replace function public.notify_on_business_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  biz_name text;
begin
  if new.sender = 'business' then
    select name into biz_name from public.businesses where id = new.business_id;
    insert into public.notifications (user_id, title, body, target_type, target_id)
    values (new.customer_id, 'New message from ' || biz_name, new.body, 'chat', new.business_id);
  end if;
  return new;
end;
$$;

create trigger on_business_message
  after insert on public.messages
  for each row execute procedure public.notify_on_business_message();
