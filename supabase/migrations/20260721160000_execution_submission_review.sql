-- TASK-EXECUTION-MODULE-001 · Phase 6 — Submission + Review hardening
-- SAQEEL-EXE-CANONICAL-PLAN v1.0 §21/§22
--
-- The atomic idempotent submission transaction and the review-time
-- operational-state wiring. This migration is strictly additive:
--   * NEW RPC public.submit_inspection is the ONE platform submission
--     transaction (plan §21): guards, server-authoritative version numbering
--     under a row lock (the client-side max+1 race in the legacy outbox path
--     can no longer collide), returned-scope byte-equality enforcement
--     (plan §22, D-020), mandatory-evidence-sync precondition over the frozen
--     snapshot rules (D-022), immutable Submission Version insert, CAS status
--     transition, visit operational_state 'submitted', journey completion and
--     audit — all in ONE transaction. The legacy direct-insert outbox path is
--     untouched and remains the pre-migration fallback.
--   * NEW trigger trg_review_operational_state keeps visits.operational_state
--     in sync with app-path review transitions (startReview/decide update
--     inspections directly): Open Review → 'under_review'; (re)submission →
--     'submitted'. The operational state persists after the review DECISION —
--     the lifecycle projection (D-002) carries approved/rejected/returned;
--     plan §22's op-state vocabulary ends at Under Review (D-021).
--   * No existing table, trigger, policy or function is altered.
--
-- Stable error tokens (mapped to explicit failure states in
-- apps/web/src/lib/offline.ts — NEVER masked as success):
--   EXE-SUBMIT-DENIED           insufficient_privilege — not the assigned
--                               inspector or missing execution.submit
--   EXE-SUBMIT-IDEMPOTENCY      check_violation — idempotency key missing
--   EXE-SUBMIT-NOT-FOUND        check_violation — inspection does not exist
--   EXE-SUBMIT-TERMINAL         check_violation — approved/rejected/cancelled
--                               inspections never accept a submission
--   EXE-SUBMIT-UNDER-REVIEW     check_violation — an open review owns the
--                               inspection; no submission until it decides
--   EXE-SUBMIT-STATE            check_violation — status outside
--                               in_progress/returned (e.g. not_started)
--   EXE-SUBMIT-EVIDENCE-PENDING check_violation — unsynced evidence rows, or
--                               mandatory evidence (frozen rules) missing
--   EXE-SUBMIT-SCOPE-VIOLATION  check_violation — a resubmission changed
--                               sections outside the returned scope (D-020)
--   EXE-SUBMIT-RACE             check_violation — the CAS status update found
--                               zero rows, or a concurrent submission conflict

-- ---------- 1 · private.execution_section_slice: comparable section object --
-- Extracts ONE section's comparable sub-object from a submission snapshot.
-- New-style snapshots carry per-section objects verbatim under 'sections';
-- legacy snapshots (pre-Phase-6) are sliced from the flat code-keyed
-- answers/notes/dates maps using the CURRENT snapshot's section membership —
-- the package version is frozen per inspection (FLD-INS-003), so section
-- membership is stable across versions of the same inspection.
create or replace function private.execution_section_slice(
  p_snapshot jsonb,
  p_section_items jsonb,
  p_section_key text
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_sec jsonb;
  v_codes text[];
begin
  v_sec := p_snapshot -> 'sections' -> p_section_key;
  if v_sec is not null then
    return v_sec;
  end if;
  select coalesce(array_agg(code), '{}'::text[])
    into v_codes
    from jsonb_array_elements_text(coalesce(p_section_items -> p_section_key, '[]'::jsonb)) code;
  return jsonb_build_object(
    'answers', coalesce((
      select jsonb_object_agg(k, val)
        from jsonb_each(coalesce(p_snapshot -> 'answers', '{}'::jsonb)) e(k, val)
       where k = any(v_codes)
    ), '{}'::jsonb),
    'notes', coalesce((
      select jsonb_object_agg(k, val)
        from jsonb_each(coalesce(p_snapshot -> 'notes', '{}'::jsonb)) e(k, val)
       where k = any(v_codes)
    ), '{}'::jsonb),
    'dates', coalesce((
      select jsonb_object_agg(k, val)
        from jsonb_each(coalesce(p_snapshot -> 'dates', '{}'::jsonb)) e(k, val)
       where k = any(v_codes)
    ), '{}'::jsonb)
  );
end $$;
revoke all on function private.execution_section_slice(jsonb, jsonb, text) from public, anon, authenticated;

-- ---------- 2 · private.execution_evidence_sorted: canonical evidence order --
-- Evidence-manifest entries are compared by id + sha, never by URLs (D-020).
-- jsonb array order is significant for '=', so both sides are canonicalized
-- to id order before comparison.
create or replace function private.execution_evidence_sorted(p_entries jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_agg(e order by e ->> 'id'), '[]'::jsonb)
    from jsonb_array_elements(coalesce(p_entries, '[]'::jsonb)) e
$$;
revoke all on function private.execution_evidence_sorted(jsonb) from public, anon, authenticated;

-- ---------- 3 · submit_inspection: the single atomic submission path --------
-- Plan §21: ONE atomic idempotent platform transaction. Guards run first,
-- then the immutable Submission Version insert (which fires the existing
-- trg_notify_submission AFTER INSERT fan-out — v1 → all reviewers, v>1 → the
-- prior reviewer), then the CAS status transition, visit operational state,
-- journey completion and audit. A failed guard rolls back EVERYTHING — no
-- partial submission survives.
create or replace function public.submit_inspection(
  p_inspection uuid,
  p_snapshot jsonb,
  p_idempotency_key text,
  p_acknowledgement jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_ins public.inspections%rowtype;
  v_existing record;
  v_version integer;
  v_sv_id uuid;
  v_returned jsonb;
  v_prior jsonb;
  v_section_items jsonb;
  v_key text;
  v_new_sec jsonb;
  v_old_sec jsonb;
  v_offenders text[] := '{}';
  v_pending integer;
  v_req uuid;
  v_section_count integer;
begin
  if v_actor is null then
    raise insufficient_privilege
      using message = 'EXE-SUBMIT-DENIED: authentication required';
  end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise check_violation
      using message = 'EXE-SUBMIT-IDEMPOTENCY: an idempotency key is mandatory (ERR-SUB-002)';
  end if;

  -- Idempotency FIRST: a replayed outbox op returns the version it created
  -- (plan §21 idempotent transaction; ERR-SUB-002).
  select sv.id, sv.version_number
    into v_existing
    from public.submission_versions sv
   where sv.idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'submission_version_id', v_existing.id,
      'version_number', v_existing.version_number,
      'reused', true
    );
  end if;

  -- Row lock BEFORE version numbering: max(version_number)+1 is computed
  -- server-side under this lock, so two offline devices submitting the same
  -- inspection can never pick the same number (fixes the client-side race).
  select * into v_ins from public.inspections i where i.id = p_inspection for update;
  if not found then
    raise check_violation
      using message = 'EXE-SUBMIT-NOT-FOUND: the inspection does not exist';
  end if;

  if not public.is_assigned_inspector(v_ins.visit_id)
     or not public.has_capability('execution.submit') then
    raise insufficient_privilege
      using message = 'EXE-SUBMIT-DENIED: only the assigned inspector with execution.submit may submit this inspection';
  end if;

  -- Lifecycle guard: initial submit from in_progress, resubmit from returned.
  if v_ins.status in ('approved', 'rejected', 'cancelled') then
    raise check_violation
      using message = 'EXE-SUBMIT-TERMINAL: a ' || v_ins.status || ' inspection never accepts a submission';
  end if;
  if v_ins.status = 'under_review' then
    raise check_violation
      using message = 'EXE-SUBMIT-UNDER-REVIEW: an open review owns this inspection — submissions wait for its decision';
  end if;
  if v_ins.status not in ('in_progress', 'returned') then
    raise check_violation
      using message = 'EXE-SUBMIT-STATE: status ' || v_ins.status || ' cannot submit — execution must be in progress or returned';
  end if;

  -- ---------- Mandatory evidence synchronized (plan §21; D-022) --------------
  -- The outbox replays evidence ops BEFORE the submit op (FIFO), so by the
  -- time this runs every captured evidence row must be synced. Anything still
  -- pending blocks the submission honestly instead of freezing an incomplete
  -- evidence manifest.
  select count(*) into v_pending
    from public.evidence e
   where e.inspection_id = p_inspection
     and e.synced_at is null
     and e.deleted_at is null
     and e.archived_at is null;
  if v_pending > 0 then
    raise check_violation
      using message = 'EXE-SUBMIT-EVIDENCE-PENDING: ' || v_pending || ' evidence item(s) are not synchronized';
  end if;

  -- Mandatory-per-item evidence: the frozen evidence rules ride the snapshot
  -- ('evidence_required' = item ids whose frozen evidence_rule is mandatory
  -- for their submitted response state). Live configuration is NEVER re-read
  -- here — the frozen snapshot is the authority (D-022).
  for v_req in
    select (x.elem #>> '{}')::uuid
      from jsonb_array_elements(coalesce(p_snapshot -> 'evidence_required', '[]'::jsonb)) x(elem)
  loop
    if not exists (
      select 1 from public.evidence e
       where e.inspection_id = p_inspection
         and e.linked_type = 'item'
         and e.linked_id = v_req
         and e.synced_at is not null
         and e.deleted_at is null
         and e.archived_at is null
    ) then
      raise check_violation
        using message = 'EXE-SUBMIT-EVIDENCE-PENDING: mandatory evidence missing for item ' || v_req::text;
    end if;
  end loop;

  -- ---------- Returned-scope guard (plan §22; D-020) --------------------------
  -- Resubmission only: when a decided Return review exists with returned
  -- sections, sections OUTSIDE that scope must be byte-identical to the latest
  -- prior version's snapshot. Comparison rule (D-020): canonical jsonb
  -- equality after normalization on the per-section sub-objects
  -- (answers/notes/dates); evidence-manifest entries are compared by id + sha
  -- (never URLs) when BOTH snapshots carry them — legacy prior snapshots
  -- without per-section evidence compare on responses only.
  select r.returned_sections into v_returned
    from public.reviews r
   where r.inspection_id = p_inspection
     and r.decision = 'return'
     and r.decided_at is not null
     and r.returned_sections is not null
   order by r.decided_at desc
   limit 1;
  if v_returned is not null and jsonb_typeof(v_returned) = 'array' then
    select sv.snapshot into v_prior
      from public.submission_versions sv
     where sv.inspection_id = p_inspection
     order by sv.version_number desc
     limit 1;
    v_section_items := coalesce(p_snapshot -> 'section_items', '{}'::jsonb);
    for v_key in select jsonb_object_keys(coalesce(p_snapshot -> 'sections', '{}'::jsonb))
    loop
      -- Inside the returned scope: free to change.
      if exists (select 1 from jsonb_array_elements_text(v_returned) rs where rs = v_key) then
        continue;
      end if;
      v_new_sec := private.execution_section_slice(p_snapshot, v_section_items, v_key);
      v_old_sec := private.execution_section_slice(v_prior, v_section_items, v_key);
      if (v_new_sec - 'evidence') is distinct from (v_old_sec - 'evidence')
         or ((v_new_sec ? 'evidence') and (v_old_sec ? 'evidence')
             and private.execution_evidence_sorted(v_new_sec -> 'evidence')
                 is distinct from private.execution_evidence_sorted(v_old_sec -> 'evidence')) then
        v_offenders := v_offenders || v_key;
      end if;
    end loop;
    if array_length(v_offenders, 1) is not null then
      raise check_violation
        using message = 'EXE-SUBMIT-SCOPE-VIOLATION: sections changed outside the returned scope: ' || array_to_string(v_offenders, ', ');
    end if;
  end if;

  -- ---------- Immutable Submission Version (server-authoritative number) -----
  select coalesce(max(sv.version_number), 0) + 1 into v_version
    from public.submission_versions sv
   where sv.inspection_id = p_inspection;

  insert into public.submission_versions (
    inspection_id, version_number, snapshot, idempotency_key, acknowledgement, submitted_by
  ) values (
    p_inspection, v_version, coalesce(p_snapshot, '{}'::jsonb), p_idempotency_key, p_acknowledgement, v_actor
  ) returning id into v_sv_id;
  -- trg_notify_submission (0018_w4_notifications_reviews, AFTER INSERT on
  -- submission_versions — verified) fans out the reviewer work item here:
  -- v1 → every reviewer, v>1 → the reviewer who returned the prior version.

  -- ---------- CAS status transition -------------------------------------------
  -- Only the guarded states may transition; zero rows means a concurrent
  -- writer moved the inspection between the guard and here — fail closed.
  update public.inspections i
     set status = 'submitted', submitted_at = now()
   where i.id = p_inspection
     and i.status in ('in_progress', 'returned');
  if not found then
    raise check_violation
      using message = 'EXE-SUBMIT-RACE: the inspection state changed during submission — retry';
  end if;
  -- The Phase 1 sync trigger maps status 'submitted' → lifecycle in_progress,
  -- and trg_review_operational_state (below) moves the visit to
  -- operational_state 'submitted'. The direct write keeps the RPC's §21
  -- contract ("Operational State Submitted") self-contained and idempotent.
  update public.visits v
     set operational_state = 'submitted'
   where v.id = v_ins.visit_id;

  -- ---------- Session completes, tracking stops (plan §21) --------------------
  update public.journey_sessions js
     set status = 'completed', ended_at = now()
   where js.visit_id = v_ins.visit_id
     and js.status in ('on_journey', 'arrived');

  -- Inspection Number: stamped by trg_inspection_no / next_inspection_no
  -- (0020_fix_media_records) at inspections insert — verified and relied on,
  -- not duplicated here.

  select count(*) into v_section_count
    from jsonb_object_keys(coalesce(p_snapshot -> 'sections', '{}'::jsonb)) k;

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'inspections', p_inspection, 'submit',
    jsonb_build_object('status', v_ins.status),
    jsonb_build_object(
      'status', 'submitted',
      'version_number', v_version,
      'sections', v_section_count
    ),
    array['EXE-SUBMIT']
  );

  return jsonb_build_object(
    'submission_version_id', v_sv_id,
    'version_number', v_version,
    'reused', false
  );
exception
  when unique_violation then
    -- A concurrent replay raced past the idempotency pre-check: resolve to
    -- the row that won. Anything else is a genuine conflict — fail closed.
    select sv.id, sv.version_number
      into v_existing
      from public.submission_versions sv
     where sv.idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object(
        'submission_version_id', v_existing.id,
        'version_number', v_existing.version_number,
        'reused', true
      );
    end if;
    raise check_violation
      using message = 'EXE-SUBMIT-RACE: concurrent submission conflict — retry';
end $$;
revoke all on function public.submit_inspection(uuid, jsonb, text, jsonb) from public, anon;
grant execute on function public.submit_inspection(uuid, jsonb, text, jsonb) to authenticated;

-- ---------- 4 · trg_review_operational_state: review ↔ op-state wiring -------
-- Plan §22 / D-021: Open Review sets Operational State 'under_review';
-- (re)submission returns it to 'submitted'. startReview/decide update
-- inspections.status directly (app path), so an AFTER UPDATE OF status
-- trigger is the single sync point — it covers both the RPC above and the
-- app-path CAS updates. After the review DECISION the operational state
-- stays 'under_review' on purpose: the plan's op-state vocabulary ends at
-- Under Review and the lifecycle projection (D-002) carries the outcome.
-- Security definer: reviewers may update inspections (0024) but hold no
-- visits UPDATE privilege; the trigger must not roll back their transition.
create or replace function public.sync_review_operational_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'under_review' and old.status <> 'under_review' then
    update public.visits v
       set operational_state = 'under_review'
     where v.id = new.visit_id;
  elsif new.status = 'submitted' and old.status <> 'submitted' then
    update public.visits v
       set operational_state = 'submitted'
     where v.id = new.visit_id;
  end if;
  -- approved / rejected / returned: operational_state intentionally unchanged
  -- (D-021 — the lifecycle projection carries the review outcome).
  return new;
end $$;
revoke all on function public.sync_review_operational_state() from public, anon;

drop trigger if exists trg_review_operational_state on public.inspections;
create trigger trg_review_operational_state
  after update of status on public.inspections
  for each row execute function public.sync_review_operational_state();
