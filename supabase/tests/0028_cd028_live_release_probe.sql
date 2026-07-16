-- TASK-G11-G12-RELEASE-001
-- CD-028 / AC-0357..AC-0409 release probe.
-- This test uses an existing immutable submission version, proves that a second
-- open review is rejected by reviews_one_open_per_version, and rolls back all
-- writes (including audit side effects) before returning.

begin;

do $release_probe$
declare
  v_version_id uuid;
  v_inspection_id uuid;
  v_constraint_name text;
  v_duplicate_blocked boolean := false;
begin
  select sv.id, sv.inspection_id
    into v_version_id, v_inspection_id
    from submission_versions sv
   where not exists (
     select 1
       from reviews r
      where r.submission_version_id = sv.id
        and r.decided_at is null
   )
   order by sv.submitted_at desc, sv.id
   limit 1;

  if v_version_id is null then
    raise exception 'CD-028 release probe has no eligible submission version';
  end if;

  insert into reviews (inspection_id, submission_version_id, status)
  values (v_inspection_id, v_version_id, 'pending_review');

  begin
    insert into reviews (inspection_id, submission_version_id, status)
    values (v_inspection_id, v_version_id, 'pending_review');
  exception
    when unique_violation then
      get stacked diagnostics v_constraint_name = CONSTRAINT_NAME;
      if v_constraint_name <> 'reviews_one_open_per_version' then
        raise exception 'CD-028 probe hit unexpected uniqueness guard: %', v_constraint_name;
      end if;
      v_duplicate_blocked := true;
  end;

  if not v_duplicate_blocked then
    raise exception 'CD-028 guard did not block a duplicate open review';
  end if;

  raise notice 'PASS CD-028: duplicate open review blocked by reviews_one_open_per_version';
end;
$release_probe$;

rollback;

select
  'PASS'::text as result,
  'CD-028 duplicate open review rejected; transaction rolled back'::text as assertion,
  not exists (
    select 1
      from reviews
     where decided_at is null
     group by submission_version_id
    having count(*) > 1
  ) as live_duplicate_check;
