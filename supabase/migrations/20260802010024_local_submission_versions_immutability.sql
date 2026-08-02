-- Local test-data certification exposed that immutable submission snapshots had
-- audit triggers but no UPDATE/DELETE blocker. This forward-only guard preserves
-- the versioned submission contract in every environment where it is applied.

create or replace function public.block_submission_version_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'IMMUTABLE: submission_versions rows cannot be updated or deleted';
end;
$$;

drop trigger if exists trg_submission_versions_immutable
  on public.submission_versions;

create trigger trg_submission_versions_immutable
before update or delete on public.submission_versions
for each row execute function public.block_submission_version_mutation();

revoke all on function public.block_submission_version_mutation() from public;

