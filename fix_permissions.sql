-- 1. Reset Storage Policies
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Anyone can upload" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects; 

-- 2. Create "Allow All" Policy for Storage (The "Hammer" Fix)
create policy "Give me access to everything"
on storage.objects for all
using ( bucket_id = 'videos' )
with check ( bucket_id = 'videos' );

-- 3. Ensure Bucket Exists and is Public
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do update set public = true;

-- 4. Reset Database Policies
drop policy if exists "Public Videos are viewable by everyone" on videos;
drop policy if exists "Anyone can upload videos" on videos;

-- 5. Re-create Database Policies
create policy "Public Videos are viewable by everyone" 
on videos for select 
using (true);

create policy "Anyone can upload videos" 
on videos for insert 
with check (true);
