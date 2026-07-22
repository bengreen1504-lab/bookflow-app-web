-- Device token storage for the native iOS app's push notifications. This is
-- the piece that doesn't need anything paid: registering a device and
-- storing its token. Actually *sending* a remote push still needs an APNs
-- Auth Key (from a paid Apple Developer Program account) plus a
-- server-side sender — a Supabase Edge Function triggered by new rows in
-- `notifications` is the natural fit, added once that account exists. Until
-- then, the app falls back to local notifications, which need no APNs.
create table public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique,
  platform text not null default 'ios',
  created_at timestamptz not null default now()
);

alter table public.device_push_tokens enable row level security;

create policy "users manage their own device tokens" on public.device_push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
