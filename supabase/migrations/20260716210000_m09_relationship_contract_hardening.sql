-- TASK-G11-G12-RELEASE-001 · MVP1-M09-005/018/021/022/024 · ENG-08
-- Forward-only authoring boundary hardening. The accepted UI vocabulary is
-- enforced again in Postgres so a direct authenticated write cannot publish a
-- package whose evidence, relationship, conditional, or scoring semantics are
-- interpreted differently by the field runtime.

-- Governed publish RPCs intentionally run with an empty search_path. The
-- historical audit helper used an unqualified table name, so trigger execution
-- inherited that empty path and could abort a valid publish before its immutable
-- audit row was written. Preserve the function identity used by every existing
-- trigger while making both dependencies explicit (M09-001 / FND-003 / ENG-12).
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_json jsonb;
  row_id uuid;
begin
  row_json := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  begin
    row_id := (row_json->>'id')::uuid;
  exception when others then
    row_id := null;
  end;
  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state
  ) values (
    auth.uid(), tg_table_name, row_id, tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end
$$;

create or replace function public.validate_m09_package_definition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  s jsonb;
  item_value jsonb;
  item_code text;
  rule jsonb;
  conditional_rule jsonb;
  evidence_rule jsonb;
  frozen_item jsonb;
  expected_response_model jsonb;
  expected_evidence_rule jsonb;
  expected_score_weight jsonb;
  catalogue_item public.inspection_items%rowtype;
  visible_when text;
  dependency_code text;
  start_code text;
  cursor_code text;
  referenced_codes text[] := '{}'::text[];
  seen_codes text[];
begin
  if new.status not in ('published', 'locked')
     or old.status is not distinct from new.status then
    return new;
  end if;

  if jsonb_typeof(new.definition->'sections') is distinct from 'array' then
    raise exception 'PACKAGE: sections array is required (M09-029)';
  end if;
  if jsonb_typeof(new.definition->'item_rules') is distinct from 'object' then
    raise exception 'PACKAGE: item_rules object is required (M09-018)';
  end if;

  for s in select value from jsonb_array_elements(new.definition->'sections') loop
    if jsonb_typeof(s) is distinct from 'object' then
      raise exception 'PACKAGE: every section must be an object (M09-029)';
    end if;
    if coalesce(btrim(s->>'title_en'), '') = ''
       or coalesce(btrim(s->>'title_ar'), '') = '' then
      raise exception 'PACKAGE: every section requires title_en and title_ar (M09-016)';
    end if;
    if not (s ? 'items') then
      continue;
    end if;
    if jsonb_typeof(s->'items') is distinct from 'array' then
      raise exception 'PACKAGE: section items must be an array (M09-029)';
    end if;

    for item_value in select value from jsonb_array_elements(s->'items') loop
      if jsonb_typeof(item_value) is distinct from 'string' then
        raise exception 'PACKAGE: section item codes must be strings (M09-029)';
      end if;
      item_code := item_value #>> '{}';
      if item_code = '' then
        raise exception 'PACKAGE: section item codes must be non-empty strings (M09-029)';
      end if;
      if not (item_code = any(referenced_codes)) then
        referenced_codes := array_append(referenced_codes, item_code);
      end if;

      select i.* into catalogue_item
        from public.inspection_items i
          join public.regulation_clauses c on c.id = i.clause_id
          join public.regulations r on r.id = c.regulation_id
       where i.code = item_code
         and i.active
         and r.status in ('published', 'locked');
      if not found then
        raise exception 'PACKAGE: item % is missing, inactive, or not anchored to a governed regulation (M09-001/012)', item_code;
      end if;

      rule := new.definition->'item_rules'->item_code;
      if jsonb_typeof(rule) is distinct from 'object'
         or coalesce(rule->>'requirement', '') not in ('required', 'optional', 'conditional') then
        raise exception 'PACKAGE: item % requires a relationship rule (M09-018)', item_code;
      end if;

      if rule ? 'scoring_enabled'
         and jsonb_typeof(rule->'scoring_enabled') is distinct from 'boolean' then
        raise exception 'PACKAGE: item % scoring_enabled must be boolean (M09-024)', item_code;
      end if;
      if rule ? 'score_weight' and jsonb_typeof(rule->'score_weight') <> 'null' then
        if jsonb_typeof(rule->'score_weight') is distinct from 'number'
           or (rule->>'score_weight')::numeric < 0 then
          raise exception 'PACKAGE: item % score_weight must be a non-negative number (M09-023/024)', item_code;
        end if;
      end if;
      if rule ? 'response_mapping'
         and jsonb_typeof(rule->'response_mapping') is distinct from 'object' then
        raise exception 'PACKAGE: item % response_mapping must be an object (M09-019/029)', item_code;
      end if;

      conditional_rule := rule->'conditional';
      if conditional_rule is not null
         and jsonb_typeof(conditional_rule) is distinct from 'object' then
        raise exception 'PACKAGE: item % conditional rule must be an object (M09-021/022)', item_code;
      end if;
      if rule->>'requirement' = 'conditional' then
        if jsonb_typeof(conditional_rule) is distinct from 'object' then
          raise exception 'PACKAGE: conditional item % requires a conditional rule (M09-021)', item_code;
        end if;
        visible_when := conditional_rule->>'visible_when';
        if coalesce(visible_when, '') = '' then
          raise exception 'PACKAGE: conditional item % requires visible_when (M09-021)', item_code;
        end if;
        if visible_when !~ '^[A-Za-z0-9_.-]+=[A-Za-z0-9_.-]+$' then
          raise exception 'PACKAGE: item % visible_when must use key=value grammar (M09-021)', item_code;
        end if;
      end if;
      if jsonb_typeof(conditional_rule) = 'object'
         and conditional_rule ? 'mandatory_when_visible'
         and jsonb_typeof(conditional_rule->'mandatory_when_visible') is distinct from 'boolean' then
        raise exception 'PACKAGE: item % mandatory_when_visible must be boolean (M09-022)', item_code;
      end if;

      evidence_rule := rule->'evidence_rule';
      if evidence_rule is not null and jsonb_typeof(evidence_rule) <> 'null' then
        if jsonb_typeof(evidence_rule) is distinct from 'object' then
          raise exception 'PACKAGE: item % evidence rule must be an object (M09-005)', item_code;
        end if;
        if coalesce(btrim(evidence_rule->>'on'), '') = '' then
          raise exception 'PACKAGE: item % evidence trigger is required (M09-005)', item_code;
        end if;
        if coalesce(evidence_rule->>'type', '') not in ('photo', 'video', 'document', 'comment') then
          raise exception 'PACKAGE: item % evidence type is not accepted (M09-005)', item_code;
        end if;
        if evidence_rule ? 'min' then
          if jsonb_typeof(evidence_rule->'min') is distinct from 'number'
             or (evidence_rule->>'min')::numeric < 1
             or (evidence_rule->>'min')::numeric <> trunc((evidence_rule->>'min')::numeric) then
            raise exception 'PACKAGE: item % evidence min must be a positive whole number (M09-005)', item_code;
          end if;
        end if;
        if evidence_rule ? 'mandatory'
           and jsonb_typeof(evidence_rule->'mandatory') is distinct from 'boolean' then
          raise exception 'PACKAGE: item % evidence mandatory must be boolean (M09-005)', item_code;
        end if;
      end if;

      -- The field runtime consumes the immutable item_snapshot. Require it to
      -- be the exact catalogue semantics plus the accepted relationship-level
      -- overrides, so direct RPC callers cannot make validation and execution
      -- disagree (M09-018/021/022/024/030).
      frozen_item := new.definition->'item_snapshot'->item_code;
      if jsonb_typeof(frozen_item) is distinct from 'object'
         or frozen_item->>'id' is distinct from catalogue_item.id::text
         or frozen_item->>'code' is distinct from catalogue_item.code
         or frozen_item->>'title' is distinct from catalogue_item.title then
        raise exception 'PACKAGE: item % requires an exact frozen catalogue snapshot (M09-030)', item_code;
      end if;

      expected_response_model := catalogue_item.response_model;
      expected_response_model := jsonb_set(
        expected_response_model, '{requirement}', to_jsonb(rule->>'requirement'), true
      );
      if jsonb_typeof(rule->'conditional') = 'object' then
        expected_response_model := jsonb_set(
          expected_response_model, '{conditional}', rule->'conditional', true
        );
      end if;
      if jsonb_typeof(rule->'response_mapping') = 'object' then
        expected_response_model := jsonb_set(
          expected_response_model, '{mapping}', rule->'response_mapping', true
        );
      end if;
      if jsonb_typeof(rule->'scoring_enabled') = 'boolean' then
        expected_response_model := jsonb_set(
          expected_response_model, '{scoring_enabled}', rule->'scoring_enabled', true
        );
      end if;
      if frozen_item->'response_model' is distinct from expected_response_model then
        raise exception 'PACKAGE: item % frozen response semantics do not match item_rules (M09-018/021/022/024/030)', item_code;
      end if;

      expected_evidence_rule := case
        when jsonb_typeof(rule->'evidence_rule') = 'object' then rule->'evidence_rule'
        else coalesce(catalogue_item.evidence_rule, 'null'::jsonb)
      end;
      expected_score_weight := case
        when rule ? 'score_weight' then rule->'score_weight'
        else coalesce(to_jsonb(catalogue_item.score_weight), 'null'::jsonb)
      end;
      if frozen_item->'evidence_rule' is distinct from expected_evidence_rule
         or frozen_item->'score_weight' is distinct from expected_score_weight
         or frozen_item->'score_excluded_on' is distinct from coalesce(to_jsonb(catalogue_item.score_excluded_on), 'null'::jsonb) then
        raise exception 'PACKAGE: item % frozen evidence/scoring semantics do not match the governed source (M09-005/024/030)', item_code;
      end if;
    end loop;
  end loop;

  -- Item-to-item condition chains must terminate. External/site flags are
  -- valid roots and leave this graph immediately.
  foreach start_code in array referenced_codes loop
    seen_codes := '{}'::text[];
    cursor_code := start_code;
    loop
      exit when cursor_code is null or not (cursor_code = any(referenced_codes));
      if cursor_code = any(seen_codes) then
        raise exception 'PACKAGE: circular visible_when chain % (M09-021/029)',
          array_to_string(array_append(seen_codes, cursor_code), ' -> ');
      end if;
      seen_codes := array_append(seen_codes, cursor_code);
      rule := new.definition->'item_rules'->cursor_code;
      exit when rule->>'requirement' is distinct from 'conditional';
      visible_when := rule#>>'{conditional,visible_when}';
      exit when visible_when is null;
      dependency_code := split_part(visible_when, '=', 1);
      exit when dependency_code = '' or not (dependency_code = any(referenced_codes));
      cursor_code := dependency_code;
    end loop;
  end loop;

  return new;
end
$$;

drop trigger if exists trg_validate_m09_package_definition on public.package_versions;
create trigger trg_validate_m09_package_definition
  before update of status on public.package_versions
  for each row execute function public.validate_m09_package_definition();

create or replace function public.validate_inspection_item_authoring()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  evidence_rule jsonb;
  response_value jsonb;
  response_token text;
begin
  if jsonb_typeof(new.response_model) is distinct from 'object' then
    raise exception 'ITEM: response_model must be an object (M09-019)';
  end if;
  if jsonb_typeof(new.response_model->'responses') is distinct from 'array' then
    raise exception 'ITEM: response_model.responses must be an array (M09-019)';
  end if;
  if new.response_model ? 'scoring_enabled'
     and jsonb_typeof(new.response_model->'scoring_enabled') is distinct from 'boolean' then
    raise exception 'ITEM: scoring_enabled must be boolean (M09-024)';
  end if;
  if new.score_weight is not null and new.score_weight < 0 then
    raise exception 'ITEM: score_weight must be non-negative (M09-023/024)';
  end if;

  evidence_rule := new.evidence_rule;
  if evidence_rule is not null and jsonb_typeof(evidence_rule) <> 'null' then
    if jsonb_typeof(evidence_rule) is distinct from 'object' then
      raise exception 'ITEM: evidence rule must be an object (M09-005)';
    end if;
    if coalesce(btrim(evidence_rule->>'on'), '') = '' then
      raise exception 'ITEM: evidence trigger is required (M09-005)';
    end if;
    if coalesce(evidence_rule->>'type', '') not in ('photo', 'video', 'document', 'comment') then
      raise exception 'ITEM: evidence type is not accepted (M09-005)';
    end if;
    if evidence_rule ? 'min' then
      if jsonb_typeof(evidence_rule->'min') is distinct from 'number'
         or (evidence_rule->>'min')::numeric < 1
         or (evidence_rule->>'min')::numeric <> trunc((evidence_rule->>'min')::numeric) then
        raise exception 'ITEM: evidence min must be a positive whole number (M09-005)';
      end if;
    end if;
    if evidence_rule ? 'mandatory'
       and jsonb_typeof(evidence_rule->'mandatory') is distinct from 'boolean' then
      raise exception 'ITEM: evidence mandatory must be boolean (M09-005)';
    end if;
  end if;

  for response_value in select value from jsonb_array_elements(new.response_model->'responses') loop
    if jsonb_typeof(response_value) is distinct from 'string' then
      raise exception 'ITEM: every response token must be a string (M09-019)';
    end if;
    if new.response_model->>'scoring_enabled' = 'false' then
      response_token := response_value #>> '{}';
      if not (response_token = any(coalesce(new.score_excluded_on, '{}'::text[]))) then
        raise exception 'ITEM: scoring-disabled responses must all be excluded (M09-024)';
      end if;
    end if;
  end loop;

  if new.response_model->>'scoring_enabled' = 'false' and new.score_weight is not null then
    raise exception 'ITEM: scoring-disabled item cannot carry score_weight (M09-024)';
  end if;
  return new;
end
$$;

drop trigger if exists trg_validate_inspection_item_authoring on public.inspection_items;
create trigger trg_validate_inspection_item_authoring
  before insert or update of response_model, evidence_rule, score_weight, score_excluded_on
  on public.inspection_items
  for each row execute function public.validate_inspection_item_authoring();

revoke all on function public.validate_m09_package_definition() from public, anon, authenticated;
revoke all on function public.validate_inspection_item_authoring() from public, anon, authenticated;
revoke all on function public.audit_row_change() from public, anon, authenticated;
