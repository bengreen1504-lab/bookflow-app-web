-- Lets a business owner attach a real photo to their listing (native camera/
-- photo-library upload from the iOS app) instead of the gray placeholder
-- block customers currently see on Home/BusinessDetail.

alter table public.businesses add column if not exists photo_url text;

-- Supabase Storage: a public bucket for business photos. Public read (photos
-- are already publicly visible on a public business listing); write access
-- is scoped to the business's own owner via a path convention of
-- "<business_id>/<filename>", checked against the businesses table the same
-- way every other owner-scoped policy in this app is.
insert into storage.buckets (id, name, public)
values ('business-photos', 'business-photos', true)
on conflict (id) do nothing;

create policy "business photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'business-photos');

create policy "business owners can upload their own business photo"
  on storage.objects for insert
  with check (
    bucket_id = 'business-photos'
    and exists (
      select 1 from public.businesses b
      where b.owner_id = auth.uid()
        -- Must be storage.objects.name (the file path being written), fully
        -- qualified — businesses also has its own `name` column, so a bare
        -- `name` here resolves to b.name (the business's name) instead,
        -- silently making this check always false. Caught by testing this
        -- against a real non-superuser Postgres role before shipping it.
        and (storage.foldername(storage.objects.name))[1] = b.id::text
    )
  );

create policy "business owners can replace their own business photo"
  on storage.objects for update
  using (
    bucket_id = 'business-photos'
    and exists (
      select 1 from public.businesses b
      where b.owner_id = auth.uid()
        -- Must be storage.objects.name (the file path being written), fully
        -- qualified — businesses also has its own `name` column, so a bare
        -- `name` here resolves to b.name (the business's name) instead,
        -- silently making this check always false. Caught by testing this
        -- against a real non-superuser Postgres role before shipping it.
        and (storage.foldername(storage.objects.name))[1] = b.id::text
    )
  );

create policy "business owners can delete their own business photo"
  on storage.objects for delete
  using (
    bucket_id = 'business-photos'
    and exists (
      select 1 from public.businesses b
      where b.owner_id = auth.uid()
        -- Must be storage.objects.name (the file path being written), fully
        -- qualified — businesses also has its own `name` column, so a bare
        -- `name` here resolves to b.name (the business's name) instead,
        -- silently making this check always false. Caught by testing this
        -- against a real non-superuser Postgres role before shipping it.
        and (storage.foldername(storage.objects.name))[1] = b.id::text
    )
  );
