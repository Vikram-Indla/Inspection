# PLAN v7 — iPad/Field Channel Delivery (Inspector PWA), 8 items, biometric split out

Supersedes v5. v5 was rejected (round 5) for 3 implementation-contract gaps: incomplete
self-enrollment predicate, IndexedDB user-scoping needing a single-captured-user-id-per-replay
model (not per-operation resolution), and the package_kind gate placed too late (must short-circuit
in the server page before any checklist/library reads, not inside the client Workspace component).
All three fixed below with exact repo citations. No new product decisions this round.

**Branch:** `feature/ipad-field-channel-delivery`, worktree off `6fc27d3f`.
**Task slice — SPONSOR OVERRIDE, FINAL, not open:** the sponsor has explicitly declined a
`CURRENT_SLICE.yaml` entry twice, in this conversation, as a deliberate decision — this is not an
oversight and is not being re-raised. Traceability is kept instead in this file +
`apps/web/DELTAS-field.md`, isolated to this branch/worktree, never touching the active
`TASK-G11-REMEDIATION-PERFORMANCE-001` slice.

## Non-negotiables (unchanged)
Semantic tokens only · logical properties/RTL · real Supabase+RLS reads, real server actions, no
mocks · missing data → explicit empty state · delta protocol logged to `apps/web/DELTAS-field.md` ·
never weaken immutable submit, geofence, Health≠Risk, RLS, fail-closed integrations · no merge/push
to `main`/`setup/Inspection`, PR only · DB changes never auto-applied to shared Supabase without a
separate explicit go · package manager npm · design check `npm --prefix apps/web run
check:design-system-v5`.

## Work items

### 1. Field Search — exact 6-type routing matrix (corrected)
`shell_global_search`/fallback API returns 6 real types (`route.ts:5`):

| Type | Current href | Field-safe fix |
|---|---|---|
| `commercial_registration` | `/factories/cr/:id` | `/field/factory-360?cr=:id` (resolver already accepts `cr`, `factory-360/page.tsx:14`) |
| `industrial_license` | `/factories/cr/:crId?license=:id` or `/factories/:factoryId` | `/field/factory-360?license=:id` (resolver already accepts `license`) |
| `plant` | same as license | `/field/factory-360?license=:id` (plant results are license rows with `plant_number` set — same resolver path) |
| `factory` | `/factories/:id` | `/field/factory-360?factory=:id` (resolver already accepts `factory`) |
| `visit` | `/visits/:id` (field-only redirected away) | `/field/:id` (real existing route, `field/[visitId]/page.tsx`) |
| `inspection` | `/field/inspection/:id` | **already field-safe, no change** |

Only the result-href construction changes (in `route.ts` and/or the client mapping layer) for a
field-only session — the resolver and inspection route already exist and need no new code.
**Acceptance:** every one of the 6 real types resolves to a field-safe destination for a field-only
session, proven by a spec asserting each href pattern.

### 2. Field Notifications — bell + detail reconciliation (unchanged from v4)
Detail route generic off `payload`/`event_key`. Field action sets `read_at` (keep `delivery_state`
write too, matching `NotificationBell.tsx:129`'s pattern). Bell's own link generation field-safe'd
for field-only sessions using the same routing fixes as item 1 where applicable (a notification
linking to a visit uses `/field/:id`, not `/visits/:id`).
**Acceptance:** unchanged from v4.

### 3. Field Settings + Trusted Devices — self-enrollment via new additive RLS policy (corrected)
Settings unchanged from v4 (language/theme/read-only sync-storage view).
**Trusted Devices — exact mechanism, corrected (round 5) against the full real schema**
(`mvp3_devices`: `id, device_identifier unique, platform check(ipad_os|web_managed),
assigned_user_id, trust_status default pending, mdm_reference, app_version,
app_version_compliant default false, last_seen_at, enrolled_by default auth.uid(), enrolled_at,
updated_at`, plus table check `trust_status<>'trusted' OR (mdm_reference not null AND
app_version_compliant)`). Current `mvp3_devices_insert` policy only allows `ops`/`security_admin`
(`20260718150000_mvp3_enterprise_control_plane.sql:425`) — untouched. Add a **new, separate,
additive** self-enroll policy guarding every security-relevant column, not just four:
```sql
create policy mvp3_devices_self_enroll_insert on public.mvp3_devices for insert to authenticated
  with check (
    assigned_user_id = (select auth.uid())
    and enrolled_by = (select auth.uid())
    and trust_status = 'pending'
    and mdm_reference is null
    and app_version_compliant = false
    and last_seen_at is null
    and platform = 'ipad_os'
  );
```
`app_version_compliant=false` is load-bearing — it's the real authorization input the package-open
RPC checks (`20260718150000_mvp3_enterprise_control_plane.sql:326`); a self-enroller must never be
able to claim compliance. `platform='ipad_os'` restricts self-enrollment to the field device class
(`web_managed` stays Ops/Security-provisioned only). Pair with a server action that only ever
inserts these exact columns — never a client-supplied arbitrary payload.
**Acceptance:** inspector can self-enroll their own device as `pending`, non-compliant, unseen,
`ipad_os` only (RLS-proven); cannot set trust/compliance/MDM/platform to anything self-serving;
existing ops/security enrollment path untouched.

### 4. Report-kind package_kind switch — shrunk (corrected)
Real fact: the actual seeded/live inspection packages (`0003_seed_contract_data.sql`) have **no
`package_kind` field at all** — today's item-code rendering (`Workspace.tsx`, `runtime.ts`) is the
correct, complete, unchanged behavior for real visit-report packages. Only the two **draft-only**
scaffold packages declare `package_kind`: `"chemical_clearance"` and `"customs_exemption"` exactly
(`20260719050000_pkg_chemical_customs_scaffold.sql:91,134`) — no `visit_report` or `safety` kind
exists anywhere. Fix, small and additive, **placed at the correct point (corrected round 5)**: the gate belongs in
the **server page** (`field/inspection/[id]/page.tsx`), immediately after `frozenDefinition =
packageVersion.definition` is computed (~line 36) and **before** `itemRead`, the checklist/library/
violation queries, and `FactoryVerification` props are built — not inside the client `Workspace`
component, which today only runs after all of that server work has already happened. If
`frozenDefinition.package_kind` is present (any value — known draft kinds or otherwise), the page
short-circuits straight to the governed "not configured" `Shell`/`EmptyState` and returns, skipping
`itemRead`/checklist/library/violation reads and the `FactoryVerification`/`Workspace` render
entirely. **Absent → current behavior, completely unchanged**, no early-return, real visit reports
render exactly as today.
**Acceptance:** real visit-report packages (no `package_kind`) render identically to today, proven
by a regression spec; any package carrying a `package_kind` (the two known draft kinds or any future
unrecognized value — fail-closed, not an allowlist) short-circuits to the empty state before any
checklist/library/violation query runs, no crash, no partial data fetch.

### 5. Submission fix (DEC-029/032) — unchanged from v4
Migration `20260722090000_fix_submission_snapshot_trigger_search_path.sql` confirmed correct and
unapplied (sponsor-confirmed). Verify + dry-run locally; apply to shared Supabase only on separate
explicit go. RPC signature: `submit_inspection(p_inspection, p_snapshot, p_idempotency_key,
p_acknowledgement)`.

### 6. Draft screen + weak-connectivity state — full-store isolation (corrected)
v4 underscoped this to "draft keys only." Real fact: **none** of the four IndexedDB stores are
user-scoped (`offline.ts:53-56` — `drafts`, `packages`, `outbox`, `conflicts` all share one
database, `DB = "mim-field-v1"`), and `processOutbox()` replays every queued op under whichever user
is currently authenticated (`offline.ts:104`) — a real cross-user replay risk on a shared device, not
just a UX nicety.
**Fix — scope the whole database, plus pin network authorization for the entire replay, not just
the IndexedDB handle (corrected round 6):** change the IndexedDB database name to include the
authenticated user id (e.g. `` `mim-field-v1:${userId}` ``) instead of the shared `"mim-field-v1"`
constant (`offline.ts:8`). Capturing the user id once for the DB handle is **not sufficient by
itself** — `offline.ts` calls the mutable Supabase browser singleton (`supabase.ts:8`), which
updates its active session globally; a mid-replay auth switch to a different user would let later
network requests inside the same `processOutbox()` loop run under the new user while still
consuming/deleting operations from the original user's outbox (real risk at the per-op identity
re-resolution points currently in `offline.ts:143,184,194,232`). Fix, precisely:
- Capture one **immutable replay context** at `processOutbox()` entry: verified user id, the
  user-scoped IndexedDB handle, **and the current access token** (`(await
  supabaseBrowser().auth.getSession()).data.session?.access_token`), all fixed for the whole call.
  Verify the token's subject actually matches the captured user id before proceeding.
- **Network calls during replay do not go through the shared `supabaseBrowser()` singleton** —
  its session is mutable and a mid-replay auth switch changes what bearer token a not-yet-resolved
  request ends up using, even after a live-user check passes. Instead, construct one **throwaway
  client scoped to the replay call only**, using supabase-js 2.110.2's root `accessToken` callback
  option — `createClient(url, anonKey, { accessToken: async () => capturedAccessToken })` — **not**
  a `global.headers` override. The `accessToken` callback form suppresses construction of a second
  GoTrue auth client entirely (avoids the documented hazard of two GoTrue clients sharing browser
  storage), and makes every request under this client resolve to exactly the captured token, nothing
  else. Never call `.auth.setSession()` on the shared singleton, never mutate it.
- **Every `local.*` IndexedDB call across the field surface** (not just the ones inside
  `processOutbox()` — real callers span `Workspace.tsx`, `Startup.tsx`, `FactoryVerification.tsx`,
  and any sync-status/pre-inspection-pack components that read offline state) must resolve the
  user-scoped database through one shared, exported accessor that takes the verified user id — no
  component independently reopens or names the IndexedDB database. The **pre-existing unscoped
  `"mim-field-v1"` database is not silently abandoned or migrated** — on first load post-fix, if it
  contains data, surface it once as a one-time "restore previous local drafts?" prompt tied to the
  currently authenticated user (their choice, not automatic), then it is never written to again.
- Before every network operation in the loop (and before deleting/marking any outbox entry
  processed), also re-check the live Supabase session's user id against the captured one — belt and
  braces alongside the pinned-token client, not a substitute for it.
- On any mismatch, **abort the replay immediately** — do not process or delete the current or any
  further operation. Leave the remaining queue exactly as-is in the original user's (now
  correctly-orphaned-per-user) database; the new user's session never touches it, since it opens its
  own separately-named database.
- Every audit/identity column written during replay is populated from the captured id, never a
  fresh read of "whoever is authenticated now."
Update the one production reference plus
[`execution-canonical-contract.spec.ts:96`](apps/web/e2e/execution-canonical-contract.spec.ts)'s
hardcoded `"mim-field-v1"` assertion to the new scoped pattern;
`factory360-ipad-field.spec.ts:67`'s reference is an intentional, unrelated Factory-360-separation
assertion and stays as-is.
Drafts list = local (from the now-user-scoped `drafts` store) + server `in_progress` union
(`field/page.tsx:508`), de-duplicated by inspection_id. Weak-connectivity: `navigator.connection`
where available, honest online/offline-only degrade where it isn't.
**Acceptance:** a spec that switches the authenticated user **after the first network operation
inside an active replay** proves: no subsequent request executes as the new user, the original
user's unprocessed queue remains fully intact, and the new user's database is untouched. A second,
adversarial spec switches auth in the narrow window between the live-user check and the pinned
client's request resolving, proving the request still executes only with the captured token (never
the new session's) or does not execute at all. Plus: correctly scoped drafts list; weak-connectivity
only fires on real signal.

### 7. Establishment gaps + incident logging (unchanged from v4)
The three "confirm during build" checks here are deliberate applications of the delta protocol
(§ non-negotiables — verify against real code before writing, don't guess), not open ambiguity:
(a) whether `factory-360` already covers "Field Establishments" or a distinct list is needed — check
`field/factory-360/page.tsx` and any list view before deciding, don't duplicate; (b) unlicensed-
establishment creation must match whatever the real Immediate Visit server action actually does
(record-only vs. record+visit) — read `visits/actions.ts`'s immediate-visit path first, implement to
match it exactly; (c) export-products field ownership (official master data vs. observed-inspection
data) — read the real `factories`/inspection-response schema first, place the field accordingly, per
FND-007's no-silent-master-data-mutation rule. Incident logging: field-safe view/route under `/field`
onto the real `incident_reports` table (`20260720010000_incident_reports.sql:30`) and its real
columns, not the plan's original invented shape.

### 8. Login — Supabase native email-OTP reset — unchanged from v4
`resetPasswordForEmail` → `verifyOtp({ type: 'recovery' })` → `updateUser({ password })` — confirmed
correct method chain. Hosted email-template OTP-capability unverifiable from repo, flagged for QA
against the real project, not blocking. `saqeel-login-revamp.spec.ts` updated deliberately.

## Explicitly out of scope
`app/(app)/planning`, `app/(app)/visits`, `app/admin/**` · biometric/WebAuthn (own deferred plan) ·
pre-existing Virtual-tab redirect bug (logged, not fixed) · Mapbox GL swap, Teams/Zoom, live
web→iPad hookup, chemical/customs/safety report catalogue content.

## Verification gates
```
design-foundation-contract.spec.ts
platform-design-system-contract.spec.ts
ui-compliance-contract.spec.ts
factory360-ipad-field.spec.ts
field-dashboard-presentation.spec.ts
field-dashboard-smoke.spec.ts
ipad-gps-policy.spec.ts
offline-drill.spec.ts
mvp2-m2-12-signature.spec.ts
mvp2-m2-02-notification-model.spec.ts
saqeel-login-revamp.spec.ts (updated deliberately, item 8)
saqeel-login-revamp-visual.spec.ts
```
Plus new specs per Acceptance line, plus `npm --prefix apps/web run check:design-system-v5` clean.

## QA after build
1. Real dev command from `apps/web/package.json`.
2. Chrome — items 1,2,3,6,7,8, EN/AR, light/dark.
3. iOS Simulator — full field channel: login → OTP reset → dashboard → search (all 6 result types)
   → establishment → inspection execution (real visit-report unchanged; chemical/customs empty-state
   verified) → draft/submit-attempt (expect known DEC-029 failure pre-apply) → notifications →
   settings/trusted-device self-enroll (pending state visible).
4. Bugs found fixed in-loop before reporting done.
