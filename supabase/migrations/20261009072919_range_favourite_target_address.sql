alter table public.key_range_presets add column target_address text not null default '';
alter table public.key_range_presets add constraint range_target_address_length check (length(target_address)<=100 and target_address !~ '[[:space:]]');
alter table public.key_range_presets drop constraint key_range_presets_owner_id_start_key_end_key_key;
alter table public.key_range_presets add constraint unique_range_target unique(owner_id,start_key,end_key,target_address);
