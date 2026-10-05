create table public.generation_records (
 id uuid primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 generated_at timestamptz not null,
 network text not null check (network in ('mainnet','testnet')),
 status text not null check (status in ('checking','complete','incomplete')),
 public_key text not null,
 addresses jsonb not null check (jsonb_typeof(addresses) = 'array'),
 encrypted_secret jsonb not null,
 has_balance boolean not null default false,
 has_transactions boolean not null default false
);
create index generation_records_owner_time on public.generation_records(owner_id,generated_at,id);
alter table public.generation_records enable row level security;
revoke all on public.generation_records from anon;
grant select,insert,update,delete on public.generation_records to authenticated;
create policy records_select on public.generation_records for select to authenticated using ((select auth.uid()) = owner_id);
create policy records_insert on public.generation_records for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy records_update on public.generation_records for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy records_delete on public.generation_records for delete to authenticated using ((select auth.uid()) = owner_id);
