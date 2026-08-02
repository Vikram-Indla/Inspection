\set ON_ERROR_STOP on
-- PLN-012 / REQ-002 / ACT-004

begin;

insert into auth.users(id,email) values
  ('00000000-0000-4000-8000-000000012101','pln012-review-supervisor@example.invalid'),
  ('00000000-0000-4000-8000-000000012102','pln012-review-planner@example.invalid');
insert into public.profiles(user_id,full_name) values
  ('00000000-0000-4000-8000-000000012101','PLN-012 Review Supervisor'),
  ('00000000-0000-4000-8000-000000012102','PLN-012 Review Planner');
insert into public.user_roles(user_id,role_key) values
  ('00000000-0000-4000-8000-000000012101','supervisor'),
  ('00000000-0000-4000-8000-000000012102','planner');

\ir ../migrations/20260729044000_supervisor_review_capability_convergence.sql

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000012101',
    true
  );
  if not public.has_capability('review.view')
     or not public.has_capability('review.decide') then
    raise exception 'PLN-012: Supervisor review capabilities are missing';
  end if;

  begin
    perform public.start_review(
      '00000000-0000-4000-8000-000000012199',
      '00000000-0000-4000-8000-000000012198'
    );
    raise exception 'PLN-012: missing inspection unexpectedly started';
  exception
    when check_violation then
      if sqlerrm <> 'REVIEW-START-STATE' then raise; end if;
  end;

  begin
    perform public.decide_review(
      '00000000-0000-4000-8000-000000012197',
      'approve',
      null,
      null
    );
    raise exception 'PLN-012: missing review unexpectedly decided';
  exception
    when check_violation then
      if sqlerrm <> 'REVIEW-DECIDE-STATE' then raise; end if;
  end;

  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000012102',
    true
  );
  begin
    perform public.start_review(
      '00000000-0000-4000-8000-000000012199',
      '00000000-0000-4000-8000-000000012198'
    );
    raise exception 'PLN-012: Planner unexpectedly passed review start authority';
  exception
    when insufficient_privilege then
      if sqlerrm <> 'REVIEW-START-DENIED' then raise; end if;
  end;

  begin
    perform public.decide_review(
      '00000000-0000-4000-8000-000000012197',
      'approve',
      null,
      null
    );
    raise exception 'PLN-012: Planner unexpectedly passed review decision authority';
  exception
    when insufficient_privilege then
      if sqlerrm <> 'REVIEW-DECIDE-DENIED' then raise; end if;
  end;
end
$$;

rollback;
