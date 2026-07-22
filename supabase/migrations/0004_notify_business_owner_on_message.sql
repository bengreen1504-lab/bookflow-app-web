-- notify_on_business_message only ever fired for sender='business' (customer
-- gets notified of a business reply); a business owner had no signal at all
-- that a customer had messaged them short of manually opening
-- /dashboard/messages. Generalizes the same trigger to notify whichever side
-- didn't send the message.
create or replace function public.notify_on_business_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  biz_name text;
  biz_owner_id uuid;
  customer_name text;
begin
  select name, owner_id into biz_name, biz_owner_id
  from public.businesses where id = new.business_id;

  if new.sender = 'business' then
    insert into public.notifications (user_id, title, body, target_type, target_id)
    values (new.customer_id, 'New message from ' || biz_name, new.body, 'chat', new.business_id);
  elsif new.sender = 'customer' then
    select full_name into customer_name from public.profiles where id = new.customer_id;
    insert into public.notifications (user_id, title, body, target_type, target_id)
    values (biz_owner_id, 'New message from ' || customer_name, new.body, 'chat', new.customer_id);
  end if;

  return new;
end;
$$;
