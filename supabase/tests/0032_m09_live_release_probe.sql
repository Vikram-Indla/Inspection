-- TASK-G11-G12-RELEASE-001 · MVP1-M09-001/005/018/021/022/024
-- Live-safe, transaction-wrapped write-flow proof. Synthetic identities,
-- configuration rows, audit rows and attachment metadata are all rolled back.
begin;

insert into auth.users (id, email) values
  ('32111111-1111-1111-1111-111111111111', 'm09-maker@example.test'),
  ('32222222-2222-2222-2222-222222222222', 'm09-checker@example.test'),
  ('32333333-3333-3333-3333-333333333333', 'm09-inspector@example.test');
insert into profiles (user_id, full_name, email) values
  ('32111111-1111-1111-1111-111111111111', 'M09 Maker', 'm09-maker@example.test'),
  ('32222222-2222-2222-2222-222222222222', 'M09 Checker', 'm09-checker@example.test'),
  ('32333333-3333-3333-3333-333333333333', 'M09 Inspector', 'm09-inspector@example.test');
insert into user_roles (user_id, role_key) values
  ('32111111-1111-1111-1111-111111111111', 'compliance_admin'),
  ('32222222-2222-2222-2222-222222222222', 'form_admin'),
  ('32333333-3333-3333-3333-333333333333', 'inspector');

set local role authenticated;
select set_config('request.jwt.claim.sub', '32111111-1111-1111-1111-111111111111', true);

insert into regulations (
  id, code, title, issuing_authority, status, effective_from, version_label, created_by
) values (
  '32444444-4444-4444-4444-444444444441', 'M09-ROLLBACK',
  'M09 rollback regulation', 'Contract probe', 'draft', current_date, 'v1', auth.uid()
);
insert into regulation_clauses (
  id, regulation_id, clause_ref, title, legal_source
) values (
  '32444444-4444-4444-4444-444444444442',
  '32444444-4444-4444-4444-444444444441',
  'M09-CLAUSE', 'M09 clause', 'M09 rollback source'
);
insert into inspection_items (
  id, code, title, clause_id, response_model, evidence_rule,
  score_weight, score_excluded_on, active
) values
  (
    '32555555-5555-5555-5555-555555555551', 'M09-ITEM-A', 'M09 required item',
    '32444444-4444-4444-4444-444444444442',
    '{"responses":["compliant","non_compliant","na"],"mapping":{"compliant":{"result":"compliant"},"non_compliant":{"result":"non_compliant"}},"scoring_enabled":true}'::jsonb,
    '{"on":"non_compliant","type":"photo","min":1,"mandatory":true}'::jsonb,
    2, array['na'], true
  ),
  (
    '32555555-5555-5555-5555-555555555552', 'M09-ITEM-B', 'M09 conditional item',
    '32444444-4444-4444-4444-444444444442',
    '{"responses":["compliant","non_compliant"],"mapping":{"compliant":{"result":"compliant"},"non_compliant":{"result":"non_compliant"}},"scoring_enabled":false}'::jsonb,
    '{"on":"non_compliant","type":"video","min":1,"mandatory":true}'::jsonb,
    null, array['compliant','non_compliant'], true
  );
insert into regulation_attachments (
  id, regulation_id, file_name, storage_path, media_type, sha256, uploaded_by
) values (
  '32666666-6666-6666-6666-666666666661',
  '32444444-4444-4444-4444-444444444441',
  'm09-rollback.pdf',
  '32444444-4444-4444-4444-444444444441/m09-rollback.pdf',
  'application/pdf', repeat('a', 64), auth.uid()
);
reset role;

-- The checker, not the maker, publishes the regulation.
set local role authenticated;
select set_config('request.jwt.claim.sub', '32222222-2222-2222-2222-222222222222', true);
select publish_regulation('32444444-4444-4444-4444-444444444441');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '32111111-1111-1111-1111-111111111111', true);
insert into packages (id, code, title, scope) values (
  '32777777-7777-7777-7777-777777777771', 'M09-ROLLBACK-PKG', 'M09 rollback package', 'contract probe'
);
insert into package_versions (
  id, package_id, version_label, status, definition, created_by, effective_from
) values (
  '32888888-8888-8888-8888-888888888881',
  '32777777-7777-7777-7777-777777777771',
  'v1', 'draft',
  jsonb_build_object(
    'sections', jsonb_build_array(jsonb_build_object(
      'key', 'safety', 'title', 'Safety', 'title_en', 'Safety', 'title_ar', 'السلامة',
      'items', jsonb_build_array('M09-ITEM-A', 'M09-ITEM-B')
    )),
    'action_forms', '[]'::jsonb,
    'item_rules', jsonb_build_object(
      'M09-ITEM-A', jsonb_build_object(
        'requirement', 'required', 'scoring_enabled', true, 'score_weight', 2,
        'evidence_rule', jsonb_build_object('on','non_compliant','type','photo','min',1,'mandatory',true)
      ),
      'M09-ITEM-B', jsonb_build_object(
        'requirement', 'conditional',
        'conditional', jsonb_build_object('visible_when','M09-ITEM-A=compliant','mandatory_when_visible',true),
        'scoring_enabled', false, 'score_weight', null,
        'evidence_rule', jsonb_build_object('on','non_compliant','type','video','min',1,'mandatory',true)
      )
    ),
    'item_snapshot', jsonb_build_object(
      'M09-ITEM-A', jsonb_build_object(
        'id','32555555-5555-5555-5555-555555555551','code','M09-ITEM-A','title','M09 required item',
        'response_model','{"responses":["compliant","non_compliant","na"],"mapping":{"compliant":{"result":"compliant"},"non_compliant":{"result":"non_compliant"}},"scoring_enabled":true,"requirement":"required"}'::jsonb,
        'evidence_rule','{"on":"non_compliant","type":"photo","min":1,"mandatory":true}'::jsonb,
        'score_weight',2,'score_excluded_on',jsonb_build_array('na')
      ),
      'M09-ITEM-B', jsonb_build_object(
        'id','32555555-5555-5555-5555-555555555552','code','M09-ITEM-B','title','M09 conditional item',
        'response_model','{"responses":["compliant","non_compliant"],"mapping":{"compliant":{"result":"compliant"},"non_compliant":{"result":"non_compliant"}},"scoring_enabled":false,"requirement":"conditional","conditional":{"visible_when":"M09-ITEM-A=compliant","mandatory_when_visible":true}}'::jsonb,
        'evidence_rule','{"on":"non_compliant","type":"video","min":1,"mandatory":true}'::jsonb,
        'score_weight','null'::jsonb,'score_excluded_on',jsonb_build_array('compliant','non_compliant')
      )
    )
  ),
  auth.uid(), current_date
);

-- Direct catalogue writes cannot bypass the four-type evidence vocabulary or
-- scoring exclusion invariant.
do $$
declare rejected boolean;
begin
  rejected := false;
  begin
    insert into inspection_items (code, title, response_model, evidence_rule, score_weight, score_excluded_on)
    values ('M09-BAD-EVIDENCE', 'bad', '{"responses":["yes"]}'::jsonb,
      '{"on":"yes","type":"voice","min":1,"mandatory":true}'::jsonb, 1, '{}');
  exception when others then rejected := true; end;
  if not rejected then raise exception 'M09_ASSERT: unaccepted item evidence type was stored'; end if;

  rejected := false;
  begin
    insert into inspection_items (code, title, response_model, score_weight, score_excluded_on)
    values ('M09-BAD-SCORING-TYPE', 'bad', '{"responses":["yes"],"scoring_enabled":"false"}'::jsonb, null, array['yes']);
  exception when others then rejected := true; end;
  if not rejected then raise exception 'M09_ASSERT: non-boolean item scoring flag was stored'; end if;

  rejected := false;
  begin
    insert into inspection_items (code, title, response_model, score_weight, score_excluded_on)
    values ('M09-BAD-EXCLUSION', 'bad', '{"responses":["yes","no"],"scoring_enabled":false}'::jsonb, null, array['yes']);
  exception when others then rejected := true; end;
  if not rejected then raise exception 'M09_ASSERT: scoring-disabled response escaped exclusion'; end if;

  rejected := false;
  begin
    insert into inspection_items (code, title, response_model, score_weight)
    values ('M09-BAD-WEIGHT', 'bad', '{"responses":["yes"],"scoring_enabled":true}'::jsonb, -1);
  exception when others then rejected := true; end;
  if not rejected then raise exception 'M09_ASSERT: negative score weight was stored'; end if;
end
$$;
reset role;

-- Publish the valid package with the independent checker.
set local role authenticated;
select set_config('request.jwt.claim.sub', '32222222-2222-2222-2222-222222222222', true);
select publish_package_version(
  '32888888-8888-8888-8888-888888888881',
  (select definition from package_versions where id='32888888-8888-8888-8888-888888888881')
);
reset role;

-- Build malformed successor drafts as the maker. Every publish attempt below
-- uses the public RPC and therefore proves the database boundary, not the UI.
set local role authenticated;
select set_config('request.jwt.claim.sub', '32111111-1111-1111-1111-111111111111', true);
insert into package_versions (id, package_id, version_label, status, definition, created_by, effective_from)
select ids.id, '32777777-7777-7777-7777-777777777771', ids.label, 'draft',
       case ids.label
         when 'bad-evidence' then jsonb_set(jsonb_set(base.definition,
           '{item_rules,M09-ITEM-A,evidence_rule,type}', '"voice"'::jsonb),
           '{item_snapshot,M09-ITEM-A,evidence_rule,type}', '"voice"'::jsonb)
         when 'bad-mandatory' then jsonb_set(jsonb_set(base.definition,
           '{item_rules,M09-ITEM-B,conditional,mandatory_when_visible}', '"true"'::jsonb),
           '{item_snapshot,M09-ITEM-B,response_model,conditional,mandatory_when_visible}', '"true"'::jsonb)
         when 'bad-scoring' then jsonb_set(jsonb_set(base.definition,
           '{item_rules,M09-ITEM-A,scoring_enabled}', '"false"'::jsonb),
           '{item_snapshot,M09-ITEM-A,response_model,scoring_enabled}', '"false"'::jsonb)
         when 'bad-weight' then jsonb_set(jsonb_set(base.definition,
           '{item_rules,M09-ITEM-A,score_weight}', '-1'::jsonb),
           '{item_snapshot,M09-ITEM-A,score_weight}', '-1'::jsonb)
         when 'bad-grammar' then jsonb_set(jsonb_set(base.definition,
           '{item_rules,M09-ITEM-B,conditional,visible_when}', '"M09-ITEM-A compliant"'::jsonb),
           '{item_snapshot,M09-ITEM-B,response_model,conditional,visible_when}', '"M09-ITEM-A compliant"'::jsonb)
         when 'bad-cycle' then jsonb_set(jsonb_set(jsonb_set(jsonb_set(base.definition,
           '{item_rules,M09-ITEM-A,requirement}', '"conditional"'::jsonb),
           '{item_rules,M09-ITEM-A,conditional}', '{"visible_when":"M09-ITEM-B=compliant","mandatory_when_visible":true}'::jsonb),
           '{item_snapshot,M09-ITEM-A,response_model,requirement}', '"conditional"'::jsonb),
           '{item_snapshot,M09-ITEM-A,response_model,conditional}', '{"visible_when":"M09-ITEM-B=compliant","mandatory_when_visible":true}'::jsonb)
         when 'bad-snapshot' then jsonb_set(base.definition,
           '{item_snapshot,M09-ITEM-A,response_model,requirement}', '"optional"'::jsonb)
       end,
       auth.uid(), current_date + 1
  from (select definition from package_versions where id='32888888-8888-8888-8888-888888888881') base
  cross join (values
    ('32888888-8888-8888-8888-888888888882'::uuid,'bad-evidence'),
    ('32888888-8888-8888-8888-888888888883'::uuid,'bad-mandatory'),
    ('32888888-8888-8888-8888-888888888884'::uuid,'bad-scoring'),
    ('32888888-8888-8888-8888-888888888885'::uuid,'bad-weight'),
    ('32888888-8888-8888-8888-888888888886'::uuid,'bad-grammar'),
    ('32888888-8888-8888-8888-888888888887'::uuid,'bad-cycle'),
    ('32888888-8888-8888-8888-888888888888'::uuid,'bad-snapshot')
  ) ids(id,label);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '32222222-2222-2222-2222-222222222222', true);
do $$
declare row record; rejected boolean;
begin
  for row in
    select id, definition from package_versions
     where id in (
       '32888888-8888-8888-8888-888888888882','32888888-8888-8888-8888-888888888883',
       '32888888-8888-8888-8888-888888888884','32888888-8888-8888-8888-888888888885',
       '32888888-8888-8888-8888-888888888886','32888888-8888-8888-8888-888888888887',
       '32888888-8888-8888-8888-888888888888'
     ) order by id
  loop
    rejected := false;
    begin
      perform publish_package_version(row.id, row.definition);
    exception when others then rejected := true; end;
    if not rejected then raise exception 'M09_ASSERT: malformed package % was published', row.id; end if;
  end loop;
end
$$;

-- A non-configuration role cannot write the item catalogue.
select set_config('request.jwt.claim.sub', '32333333-3333-3333-3333-333333333333', true);
do $$
declare rejected boolean := false;
begin
  begin
    insert into inspection_items (code, title, response_model)
    values ('M09-INSPECTOR-WRITE', 'forbidden', '{"responses":["yes"]}'::jsonb);
  exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'M09_ASSERT: inspector wrote configuration'; end if;
end
$$;
reset role;

do $$
begin
  if not exists (
    select 1 from package_versions
     where id='32888888-8888-8888-8888-888888888881'
       and status='published'
       and definition#>>'{item_snapshot,M09-ITEM-B,response_model,conditional,visible_when}'='M09-ITEM-A=compliant'
       and definition#>>'{item_snapshot,M09-ITEM-B,response_model,scoring_enabled}'='false'
  ) then raise exception 'M09_ASSERT: governed runtime snapshot was not published'; end if;

  if (select count(*) from package_versions
       where id between '32888888-8888-8888-8888-888888888882'::uuid
                    and '32888888-8888-8888-8888-888888888888'::uuid
         and status <> 'draft') <> 0 then
    raise exception 'M09_ASSERT: malformed successor escaped draft status';
  end if;

  if not exists (
    select 1 from audit_events
     where actor='32222222-2222-2222-2222-222222222222'
       and object_type='package_versions'
       and object_id='32888888-8888-8888-8888-888888888881'
       and action='UPDATE'
  ) then raise exception 'M09_ASSERT: package publish audit evidence missing'; end if;

  if not exists (
    select 1 from audit_events
     where actor='32111111-1111-1111-1111-111111111111'
       and object_type='regulation_attachments'
       and object_id='32666666-6666-6666-6666-666666666661'
       and action='INSERT'
  ) then raise exception 'M09_ASSERT: regulation attachment audit evidence missing'; end if;
end
$$;

select
  'PASS'::text as result,
  'M09 regulation/item/package writes, maker-checker, runtime snapshots, RLS, audit, and malformed-direct-RPC rejection passed; transaction rolled back'::text as assertion;
rollback;

select
  'PASS'::text as result,
  (select count(*) from profiles where email like 'm09-%@example.test') as residual_profile_rows,
  (select count(*) from package_versions
    where id between '32888888-8888-8888-8888-888888888881'::uuid
                 and '32888888-8888-8888-8888-888888888888'::uuid) as residual_package_rows;
