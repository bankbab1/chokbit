create table public.generated_keys (
 id uuid primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 generated_at timestamptz not null,
 network text not null check (network in ('mainnet','testnet')),
 public_key text not null,
 addresses jsonb not null check (jsonb_typeof(addresses)='array' and jsonb_array_length(addresses)=5),
 encrypted_secret jsonb not null
);
create index generated_keys_owner_time on public.generated_keys(owner_id,generated_at,id);
alter table public.generated_keys enable row level security;
revoke all on public.generated_keys from anon;
grant select,insert,update on public.generated_keys to authenticated;
create policy generated_keys_select on public.generated_keys for select to authenticated using ((select auth.uid())=owner_id);
create policy generated_keys_insert on public.generated_keys for insert to authenticated with check ((select auth.uid())=owner_id);
create policy generated_keys_update on public.generated_keys for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
