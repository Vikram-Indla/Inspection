-- TASK-G11-G12-RELEASE-001 · CD-031 live release probe.
-- Uses the existing seeded Planner and Inspector personas, exercises the real
-- live RLS policies and canonical audit triggers, then rolls back every write.
begin;

select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from profiles where email = 'planner@mim.gov.sa'),
  true
);
set local role authenticated;

insert into factory_documents (
  id, factory_id, doc_type, title, reference_no, uploaded_by
) values (
  '39444444-4444-4444-4444-444444444441',
  (select id from factories order by factory_code limit 1),
  'other', 'CD-031 rollback probe', 'CD031-ROLLBACK', auth.uid()
);
insert into factory_representatives (
  id, factory_id, full_name, role_title, active
) values (
  '39444444-4444-4444-4444-444444444442',
  (select id from factories order by factory_code limit 1),
  'CD-031 rollback probe', 'Test only', true
);
insert into factory_products (
  id, factory_id, name, hs_code, created_by
) values (
  '39444444-4444-4444-4444-444444444443',
  (select id from factories order by factory_code limit 1),
  'CD-031 rollback probe', '0000.00', auth.uid()
);
insert into factory_materials (
  id, factory_id, name, source, hs_code, created_by
) values (
  '39444444-4444-4444-4444-444444444444',
  (select id from factories order by factory_code limit 1),
  'CD-031 rollback probe', 'local', '0000.00', auth.uid()
);
update factory_representatives
   set active = false
 where id = '39444444-4444-4444-4444-444444444442'
   and factory_id = (select id from factories order by factory_code limit 1);
reset role;

select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from profiles where email = 'inspector@mim.gov.sa'),
  true
);
set local role authenticated;
do $$
begin
  begin
    insert into factory_documents (factory_id, doc_type, title)
    values ((select id from factories order by factory_code limit 1), 'other', 'forbidden');
    raise exception 'CD031_ASSERT: inspector document insert was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into factory_representatives (factory_id, full_name)
    values ((select id from factories order by factory_code limit 1), 'forbidden');
    raise exception 'CD031_ASSERT: inspector representative insert was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into factory_products (factory_id, name)
    values ((select id from factories order by factory_code limit 1), 'forbidden');
    raise exception 'CD031_ASSERT: inspector product insert was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into factory_materials (factory_id, name, source)
    values ((select id from factories order by factory_code limit 1), 'forbidden', 'local');
    raise exception 'CD031_ASSERT: inspector material insert was accepted';
  exception when insufficient_privilege then null;
  end;
end
$$;
update factory_representatives
   set active = true
 where id = '39444444-4444-4444-4444-444444444442';
reset role;

do $$
declare
  v_planner uuid;
begin
  select user_id into v_planner from profiles where email = 'planner@mim.gov.sa';
  if v_planner is null then
    raise exception 'CD031_ASSERT: live Planner persona missing';
  end if;
  if not exists (
    select 1 from factory_representatives
     where id = '39444444-4444-4444-4444-444444444442' and active = false
  ) then
    raise exception 'CD031_ASSERT: Planner activation missing or Inspector escaped RLS';
  end if;
  if (
    select count(*) from audit_events
     where actor = v_planner
       and (object_type, object_id) in (
         ('factory_documents', '39444444-4444-4444-4444-444444444441'::uuid),
         ('factory_representatives', '39444444-4444-4444-4444-444444444442'::uuid),
         ('factory_products', '39444444-4444-4444-4444-444444444443'::uuid),
         ('factory_materials', '39444444-4444-4444-4444-444444444444'::uuid)
       )
       and action in ('INSERT', 'UPDATE')
  ) <> 5 then
    raise exception 'CD031_ASSERT: expected four live insert audits plus one activation audit';
  end if;
end
$$;

select
  'PASS'::text as result,
  'CD-031 Planner writes + activation + audit passed; Inspector writes denied; transaction rolled back'::text as assertion;
rollback;
