-- Create user-avatars bucket (public, for profile photos)
insert into storage.buckets (id, name, public)
values ('user-avatars', 'user-avatars', true)
on conflict (id) do update set public = true;

-- Allow authenticated users to upload their own avatars
-- Path format: avatars/{userId}.{ext}
create policy "Users can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'user-avatars'
    and name like 'avatars/' || auth.uid()::text || '.%'
  );

-- Allow authenticated users to update their own avatars
create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'user-avatars'
    and name like 'avatars/' || auth.uid()::text || '.%'
  );

-- Allow authenticated users to delete their own avatars
create policy "Users can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'user-avatars'
    and name like 'avatars/' || auth.uid()::text || '.%'
  );

-- Allow public read access (bucket is public)
create policy "Public can read avatars"
  on storage.objects for select
  to public
  using (bucket_id = 'user-avatars');
