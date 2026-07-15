-- CD-006..CD-011 backend foundation: configuration records that are mutable
-- through the control plane must have the same append-only audit evidence as
-- regulations and package versions. This is forward-only and does not alter
-- existing RLS policy or lifecycle semantics.

do $$ declare t text;
begin
  foreach t in array array['regulation_clauses','inspection_items','violation_codes','penalty_mappings'] loop
    if not exists (
      select 1 from pg_trigger
      where tgname = format('trg_audit_%s', t)
        and tgrelid = to_regclass(format('public.%I', t))
    ) then
      execute format(
        'create trigger trg_audit_%s after insert or update or delete on %I for each row execute function audit_row_change()',
        t, t
      );
    end if;
  end loop;
end $$;

-- CD-006: the existing regulation table has a governed draft → published
-- lifecycle. Persist the maker/checker evidence and make a published record
-- immutable at the database boundary. A successor-version model is deliberately
-- not invented here; it requires its own approved lineage contract.
alter table regulations
  add column if not exists created_by uuid references profiles(user_id),
  add column if not exists approved_by uuid references profiles(user_id),
  add column if not exists published_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'regulations_maker_checker') then
    alter table regulations add constraint regulations_maker_checker
      check (approved_by is null or created_by is null or approved_by <> created_by);
  end if;
end $$;

create or replace function guard_published_regulation() returns trigger language plpgsql as $$
begin
  if old.status in ('published', 'locked') and new is distinct from old then
    raise exception 'IMMUTABLE: published regulation % cannot be modified; create a governed successor draft', old.code;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_published_regulation on regulations;
create trigger trg_guard_published_regulation
  before update or delete on regulations
  for each row execute function guard_published_regulation();
