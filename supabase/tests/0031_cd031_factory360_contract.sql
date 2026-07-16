-- CD-031 · MVP1-M07 · ENG-12
-- Owner-run, transaction-wrapped proof of the four Factory 360 write surfaces,
-- their existing RLS restrictions, representative activation and append-only
-- audit coverage. Every fixture and temporary grant is rolled back.
begin;

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema public, auth to authenticated;
grant execute on function auth.uid() to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into auth.users (id, email) values
  ('31111111-1111-1111-1111-111111111111', 'cd031-planner@example.test'),
  ('32222222-2222-2222-2222-222222222222', 'cd031-inspector@example.test');
insert into profiles (user_id, full_name, email) values
  ('31111111-1111-1111-1111-111111111111', 'CD-031 Planner', 'cd031-planner@example.test'),
  ('32222222-2222-2222-2222-222222222222', 'CD-031 Inspector', 'cd031-inspector@example.test');
insert into user_roles (user_id, role_key) values
  ('31111111-1111-1111-1111-111111111111', 'planner'),
  ('32222222-2222-2222-2222-222222222222', 'inspector');
insert into factories (
  id, factory_code, name, cr_number, license_number, region, city, source
) values (
  '33333333-3333-3333-3333-333333333331', 'CD031-F1', 'CD-031 contract factory',
  'CD031-CR', 'CD031-LIC', 'Riyadh', 'Riyadh', 'contract-test'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '31111111-1111-1111-1111-111111111111', true);

insert into factory_documents (
  id, factory_id, doc_type, title, reference_no, uploaded_by
) values (
  '34444444-4444-4444-4444-444444444441',
  '33333333-3333-3333-3333-333333333331',
  'license', 'CD-031 document', 'CD031-DOC',
  '31111111-1111-1111-1111-111111111111'
);
insert into factory_representatives (
  id, factory_id, full_name, role_title, active
) values (
  '34444444-4444-4444-4444-444444444442',
  '33333333-3333-3333-3333-333333333331',
  'CD-031 Representative', 'HSE', true
);
insert into factory_products (
  id, factory_id, name, hs_code, created_by
) values (
  '34444444-4444-4444-4444-444444444443',
  '33333333-3333-3333-3333-333333333331',
  'CD-031 Product', '3920.10',
  '31111111-1111-1111-1111-111111111111'
);
insert into factory_materials (
  id, factory_id, name, source, hs_code, created_by
) values (
  '34444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333331',
  'CD-031 Material', 'local', '3901.10',
  '31111111-1111-1111-1111-111111111111'
);
update factory_representatives
   set active = false
 where id = '34444444-4444-4444-4444-444444444442'
   and factory_id = '33333333-3333-3333-3333-333333333331';
reset role;

-- Inspector can read the dossier but cannot use any of its four write policy
-- families. UPDATE is RLS-filtered to zero rows; INSERT raises 42501.
set local role authenticated;
select set_config('request.jwt.claim.sub', '32222222-2222-2222-2222-222222222222', true);
do $$
begin
  begin
    insert into factory_documents (factory_id, doc_type, title)
    values ('33333333-3333-3333-3333-333333333331', 'other', 'forbidden');
    raise exception 'CD031_ASSERT: inspector document insert was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into factory_representatives (factory_id, full_name)
    values ('33333333-3333-3333-3333-333333333331', 'forbidden');
    raise exception 'CD031_ASSERT: inspector representative insert was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into factory_products (factory_id, name)
    values ('33333333-3333-3333-3333-333333333331', 'forbidden');
    raise exception 'CD031_ASSERT: inspector product insert was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into factory_materials (factory_id, name, source)
    values ('33333333-3333-3333-3333-333333333331', 'forbidden', 'local');
    raise exception 'CD031_ASSERT: inspector material insert was accepted';
  exception when insufficient_privilege then null;
  end;
end
$$;
update factory_representatives
   set active = true
 where id = '34444444-4444-4444-4444-444444444442';
reset role;

do $$
begin
  if not exists (
    select 1 from factory_representatives
     where id = '34444444-4444-4444-4444-444444444442' and active = false
  ) then
    raise exception 'CD031_ASSERT: planner activation update missing or inspector update escaped RLS';
  end if;

  if (
    select count(*) from audit_events
     where actor = '31111111-1111-1111-1111-111111111111'
       and (object_type, object_id) in (
         ('factory_documents', '34444444-4444-4444-4444-444444444441'::uuid),
         ('factory_representatives', '34444444-4444-4444-4444-444444444442'::uuid),
         ('factory_products', '34444444-4444-4444-4444-444444444443'::uuid),
         ('factory_materials', '34444444-4444-4444-4444-444444444444'::uuid)
       )
       and action in ('INSERT', 'UPDATE')
  ) <> 5 then
    raise exception 'CD031_ASSERT: expected four insert audits plus one activation audit';
  end if;
end
$$;

select 'CD031_DATABASE_CONTRACT_PASS' as result;
rollback;
