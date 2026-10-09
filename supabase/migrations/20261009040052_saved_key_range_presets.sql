create table public.key_range_presets (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 80),
 start_key text collate "C" not null,
 end_key text collate "C" not null,
 created_at timestamptz not null default now(),
 last_used_at timestamptz not null default now(),
 constraint valid_key_range check (
 start_key ~ '^[0-9a-f]{64}$' and end_key ~ '^[0-9a-f]{64}$'
 and start_key > repeat('0',64) and start_key <= end_key
 and end_key <= 'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140'),
 unique(owner_id,start_key,end_key)
);
create index key_range_presets_owner_recent on public.key_range_presets(owner_id,last_used_at desc);
alter table public.key_range_presets enable row level security;
revoke all on public.key_range_presets from anon, authenticated;
grant select,insert,update,delete on public.key_range_presets to authenticated;
create policy "Read own ranges" on public.key_range_presets for select to authenticated using ((select auth.uid())=owner_id);
create policy "Save own ranges" on public.key_range_presets for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "Update own ranges" on public.key_range_presets for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "Delete own ranges" on public.key_range_presets for delete to authenticated using ((select auth.uid())=owner_id);
insert into public.key_range_presets(owner_id,name,start_key,end_key)
select id,'My fixed range','0000000000000000000000000000000000000000000000400000000000000000','00000000000000000000000000000000000000000000007fffffffffffffffff'
from auth.users where lower(email)='chokchai.ecs@gmail.com';
