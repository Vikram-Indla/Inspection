\set ON_ERROR_STOP on
begin;

\ir ../migrations/20260729090000_single_publish_package_alias_repair.sql

do $$
declare
  v_definition text;
begin
  select pg_get_functiondef(p.oid) into v_definition
  from pg_proc p
  where p.pronamespace='public'::regnamespace
    and p.proname='publish_single_visit_atomic';
  if position('selected.package_version_id' in v_definition)=0
     or position('as selected(package_version_id)' in v_definition)=0
     or position('where pv.id = package_id' in v_definition)>0 then
    raise exception 'RAL-P27: selected package versions must use an unambiguous alias';
  end if;
  if position('PLANNING-SINGLE-PUBLISH-PACKAGE' in v_definition)=0
     or position('publish_single_visit(' in v_definition)=0
     or position('visit_packages' in v_definition)=0
     or position('snapshot' in v_definition)=0 then
    raise exception 'RAL-P27: publisher guards and snapshots must remain installed';
  end if;
end
$$;

rollback;
