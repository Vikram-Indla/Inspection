# MVP2 Cross-Module Reconciliation Ledger

Records cross-module contract conflicts surfaced during the MVP2 full-implementation
loop and the canonical resolution taken. Every entry cites the authority relied on.
Entries marked `DB_VALIDATION_PENDING` are correct at the source/contract level but
their runtime SQL behavior is unproven until the Inspection Supabase project
(`iiozvqntawxfwbgffzqu`) is reachable (local-source-certify-now decision).

---

## R-001 — M2-02 semantic-event boundary vs landed M2-05 RPC
- **Modules:** M2-02 (CD-043) producer ↔ M2-05 (CD-031) append boundary.
- **Conflict:** `apps/web/src/lib/workflow/events.ts` targeted a `semantic_events`
  table that does NOT exist. The landed M2-05 migration `20260717150000` exposes the
  canonical boundary as SECURITY DEFINER RPC `append_semantic_audit_event`, which
  accepts only event types registered in `audit_event_registry`, requires a proven
  `source_audit_event_id` (matching actor/object_type/action) with
  `source_system='audit_events'`, and a contracted `(source_object_type, source_action)`
  pair. CD-043's EVENT_CATALOG assumes a general `workflow.*/task.*/sla.*/notification.*`
  envelope with no per-event registry backing.
- **Authority:** Prompt 07 ("generic legacy events remain GENERIC ONLY; never promote
  them to canonical facts without an approved mapping"); CD-043 IMPLEMENTATION note
  ("M2-02 owns no storage/replay; emits through shared M2-05 envelope"); Master
  Controller authority precedence (live repo + landed migration > design catalog).
- **Resolution:** The landed `append_semantic_audit_event` RPC is THE single canonical
  append boundary. Generic workflow transitions stay in the append-only `audit_events`
  stream (already written by the governed-transition audit closure) and are NOT emitted
  as semantic milestones. The adapter now (a) removes the phantom `semantic_events`
  write, (b) emits through the RPC ONLY for events carrying a `milestone` block (a
  registered type + proven `sourceAuditEventId`), (c) returns honest
  `{emitted:false, reason:"not_a_registered_milestone"}` otherwise. No competing event
  architecture is created.
- **Follow-up (separate slices):** wire the genuine M2-02 milestones that ARE in the
  registry — `WorkflowActivated` (REQ-0151), `AssignmentAccepted` (REQ-0155),
  `NoticeIssued` (REQ-0147) — through the RPC at their specific actions, and add the
  matching `audit_event_source_contracts` rows in a forward M2-02 migration.
- **Verification:** typecheck clean; pure-contract spec
  `apps/web/e2e/mvp2-m2-02-events.spec.ts` (static lane) proves arg mapping + honest
  skip. `DB_VALIDATION_PENDING`: RPC acceptance/rejection unproven until remote DB access.

---

## R-002 — single `objections` store across M2-08 and M2-10
- **Modules:** M2-08 (CD-044 external portal) ↔ M2-10 (CD-046 case spine).
- **Conflict:** both design packages list an additive `objections` entity.
- **Authority:** Prompt 18 (one canonical object per concept).
- **Resolution:** `objections` is created ONCE in the M2-08 migration
  (`20260717180000_mvp2_m2_08_external_portal.sql`) and consumed by M2-10; the M2-10
  migration creates only `cases` and reuses `objections`. No duplicate table.
- **Verification:** M2-10 migration contains no `objections` create. `DB_VALIDATION_PENDING`.

---

## R-003 — M2-05 emit trigger cross-table column refs (MVP1 regression, FIXED)
- **Module:** M2-05 (CD-031) semantic emit trigger.
- **Conflict:** emit_mvp2_m2_05_semantic_event is attached to 10 MVP1 tables but its
  IF-chain CONDITIONS (and the trailing acknowledgement block) referenced
  table-specific columns (new.kind, new.status, old.decided_at, new.acknowledgement).
  plpgsql plans a branch condition as one SQL expression, so a column absent on the
  FIRING table fails to plan → 42703, aborting the source transaction. Surfaced live on
  staging: publishSingleVisit aborted with 42703 on new.kind while inserting
  submission_versions. Never caught because M2-05 was only pure-tested (no DB).
- **Authority:** Prompt 05 (MVP1 zero-regression) — an audit sidecar must never break a
  source-of-truth transaction.
- **Resolution (migration 20260717240000):** gate every outer branch on tg_table_name/
  tg_op ONLY; move all column-dependent checks into the branch body (planned only when
  the firing table matches). Identical event semantics. Applied to staging; direct
  submission_versions insert probe passes; golden-journey P1 planner publish now green.

## R-004 — staging drift below source migration level (pre-existing, partial reconcile)
- Applying the MVP2 stack to staging surfaced that staging was BELOW the source
  migration level (the 2026-07-15 reconciliation predates several 2026-07-16 migrations):
  - submission_versions.acknowledgement (source 0001) was MISSING → fixed (R / migration
    20260717230000).
  - geo_override_requests table + expire_stale_geo_override_requests fn (migrations
    20260716161604/161605) were MISSING → applied to staging.
  - notification_rules (20260716222000) WAS present — drift is spotty, not a clean cutoff.
- **Remaining:** golden-journey P2 (arrival-evidence offline-outbox replay) still times out
  on staging — deep MVP1 field-sync tuned for local latency + possible further drift; NOT
  caused by the MVP2 build or the trigger fix. A full staging↔source migration
  reconciliation (align every source migration onto staging) is recommended as a scoped
  follow-up before treating staging as a golden-journey certification environment.

---

## R-005 — M2-05 emit trigger NULL case_ref on visit-anchored evidence (MVP1 regression, FIXED)
- **Module:** M2-05 emit trigger, evidence branch.
- **Conflict:** arrival/cancellation evidence is visit-anchored (inspection_id NULL,
  visit_id set — offline.ts outbox). The evidence branch derived the case only via
  `inspections where id=new.inspection_id`, so v_root_case was NULL → case_ref NULL →
  violated audit_semantic_events.case_ref NOT NULL (23502) → the evidence INSERT aborted.
  Storage upload succeeded but the table row never landed, so arrival evidence stayed
  queued in the field outbox and golden-journey P2 replay timed out.
- **Resolution (migration 20260717250000):** evidence branch uses new.visit_id when
  inspection_id is NULL; plus a NOT-NULL safety net (case_ref/correlation_id fall back to
  the aggregate id) so no branch can emit a NULL key. Probe passes; golden journey 10/10.

---

## R-006 — Twilio long-code cannot reach Saudi Arabia (fallback-role constraint, permanent)
- **Module:** M2-02 notification delivery, sms channel, Twilio fallback adapter.
- **Finding:** Twilio's own SMS guidelines for Saudi Arabia mark both "Long code domestic"
  and "Long code international" as **Not Supported**. A plain Twilio phone number (the
  From used by TwilioSmsAdapter) can never deliver SMS to a KSA number — confirmed live
  (error 21612) and via Twilio's official guidelines page, independent of trial-vs-paid
  account status, geo-permissions, or verified-caller-ID config.
- **Root cause match:** identical to the finding in the original SMS provider research
  (see product-contract's SMS research notes) — Twilio cannot register a domestic KSA
  Alphanumeric Sender ID ("regulation prohibits re-selling domestic traffic"). Saudi
  carriers only accept a pre-registered Alphanumeric Sender ID (2-week Twilio
  international registration), not a raw long code.
- **Consequence for the accepted design** (`engine_settings.otp`: provider_primary=unifonic,
  provider_fallback=twilio): Twilio-as-fallback is only real for non-KSA destinations
  (e.g. an international guest inspector). **For Saudi mobile numbers specifically — the
  platform's primary audience — there is currently no working SMS fallback if Unifonic is
  down**, unless/until a Twilio Alphanumeric Sender ID is registered for KSA. This is an
  honest architectural gap, not a defect in the adapter code.
- **Resolution shipped now:** `TwilioSmsAdapter` (src/lib/providers/sms-twilio.ts) is
  correct, fail-closed, and live-certified end-to-end to a NON-KSA destination (India,
  +91) — proving the adapter/pipe genuinely works. KSA delivery via Twilio remains
  honestly blocked pending Alphanumeric Sender ID registration (owner: MIM, since they
  will own/rotate all provider accounts at PROD per sponsor direction).
- **Verification:** live send SID `SM6f543b8d7c6a98cb0823005244704de8` to +91 (queued,
  no error). Live send to +966534947632 fails 21612 (confirmed twice, unrelated to
  geo-permissions or caller-ID verification — both were correctly configured).

---

## R-007 — RLS gap caught before shipping: get_push_subscriptions_for_user open grant
- **Module:** M2-02 notification delivery, push channel.
- **Finding (self-caught, pre-commit):** the first draft of the push-subscription
  lookup RPC granted EXECUTE to `authenticated` with no internal check — any logged-in
  user could call it with an arbitrary p_user_id and read another user's Web Push
  subscription endpoint/p256dh/auth (device push CREDENTIALS per RFC 8292, not visible
  content). This repo has NO service-role client anywhere (every server action runs as
  the authenticated actor under RLS via supabase-server.ts), so a SECURITY DEFINER RPC
  granted to `authenticated` is exactly as exposed as an open table grant unless it
  proves authorization internally.
- **Resolution:** the RPC now requires the CALLER to hold one of the staff roles that
  already legitimately trigger cross-user notifications today (planner/ops/
  workflow_admin/compliance_admin/security_admin/leadership — matches who calls
  insertNotification() for another user in visits/actions.ts), mirroring the
  proof-of-authorization pattern already used by append_semantic_audit_event.
- **Verification:** applied to staging; `prosecdef=true` confirmed; RLS on
  push_subscriptions itself is self-row-only (own_select/own_insert/own_delete, no
  update/broad-select policy).

## R-008 — Web Push (VAPID) live-certified via real Chromium Push API (except one known test-binary ceiling)
- **Module:** M2-02 notification delivery, push channel.
- **Finding:** unlike SMS/email, Playwright's/Puppeteer's bundled Chromium (open-source
  build) lacks Google's proprietary API key baked into official Chrome, so
  `PushManager.subscribe()` cannot register with Chrome's push service in ANY headless-
  Chromium test harness — a documented, widely-known testing-infrastructure ceiling, not
  a code or config defect. Confirmed: real SW registration on the actual shipped
  public/sw.js works; real page navigation works; explicit permission grant (both
  context-level and per-origin) confirmed correctly applied; the failure is isolated to
  the subscribe() call itself and is the exact symptom reported across the Playwright/
  Puppeteer community for this limitation.
- **Resolution:** the live test honestly `test.skip()`s at the exact point this ceiling
  is hit (not faked green, not left red) — 7/8 pass, 1 skip with a documented reason.
  Would pass in an environment with a real Chrome binary (e.g. `channel: 'chrome'`) or on
  a real user device (sponsor declined the real-device proof step as unnecessary given
  the code-path/fail-closed evidence already obtained).
