# G5 External Assessment Reconciliation

**Source document:** `MIM_Inspection_Strategic_Discovery_Assessment.md` (external, dated 2026-07-12, provided by user)
**Reconciled against:** `product-contract/governance/decision_register.csv`, `docs/G5_ARCHITECTURE_AND_READINESS.md` (dated 2026-07-11), live repository state at commit `0ea7bc9` (2026-07-11 20:44 +0300), `product-contract/evidence/STORYBOARD_STATUS.md`
**Task:** G5-ARCH-DISCOVERY (gate G5, `DISCOVERY_COMPLETE_AWAITING_DECISIONS`, `broad_implementation_allowed: false`)
**Author scope:** Reconciliation only. No code, schema, or decision-register changes applied. No task-router entries created.

---

## 1. Executive conclusion

The external assessment is **materially useful and partially stale**. It correctly identifies four live, reproducible integrity defects in the current codebase (fabricated GPS, false offline-submitted state, over-broad RLS, direct workflow-status writes) — all four are **CONFIRMED** below with exact file/line/policy evidence. These map onto **existing open P0 decisions** in the register (DEC-002, DEC-006, DEC-009, and the ENG-03/RBAC contracts that DEC-001/003/004/005/007/008/009/010 sit under) but are not *identical* to any single register row — the register records **policy decisions still owed**, while the external findings describe **implementation defects that exist regardless of which policy is ultimately chosen**. They are complementary, not duplicate.

The assessment is also **built on a stale premise it does not state**: `docs/G5_ARCHITECTURE_AND_READINESS.md` (2026-07-11) asserts the repository is a "greenfield" containing **no application code**. That premise is now **false** — the current repository contains a working Next.js/Supabase application (`apps/web/`, 29 route directories, 14 SQL migration files) built in commits `b7abb8c` through `0ea7bc9`, all landed the same day the G5 report was written or after. **This is the most important reconciliation finding in this document**: the G5 architecture report and the external assessment are each half-right about a moving target, and neither is currently authoritative on its own. Three external findings (#6 role-aware navigation, #14 Arabic/RTL, #10's "hardcoded v1" sub-claim) describe defects that **do not reproduce against current code** — the repository has since implemented a `/launch` role router, a locale-aware `<html lang dir>` with bilingual admin tooling, and a dynamically computed submission version number. These are logged as **conflicts**, not accepted, and not silently dismissed — they need re-verification in a live browser session before being closed.

**Bottom line: G5 cannot pass and must remain FAILED/OPEN.** Not because the external assessment's severity framing is fully correct (it is not — some P0s it flags are already mitigated), but because (a) four P0 integrity defects are independently confirmed in running code, (b) all ten existing DEC-* decisions remain Open, and (c) the G5 architecture report's own foundational claim about repository state is now inaccurate and must be regenerated before G5 evidence can be trusted at all.

---

## 2. Reconciliation methodology

1. Read the external assessment's 20 findings and 8 KSA/compliance gates in full.
2. Read `decision_register.csv` (10 rows, all `Open`), `docs/G5_ARCHITECTURE_AND_READINESS.md` (239 lines), `product-contract/evidence/STORYBOARD_STATUS.md`, `product-contract/domain/personas.yaml`, `product-contract/domain/rbac_matrix.csv`.
3. For every finding citing a file/line, independently re-read that exact file in the current working tree and recorded whether the cited behavior reproduces, has changed, or cannot be located.
4. For the four mandated P0 integrity findings, traced the full runtime path: React component → Supabase client call → migration-defined table/RLS policy → resulting database state.
5. Cross-checked route/persona/storyboard counts against `screen_route_catalogue.csv`, `personas.yaml`, `rbac_matrix.csv`, and `STORYBOARD_STATUS.md` rather than trusting either document's summary numbers.
6. No finding was accepted, rejected, or merged into a decision without a specific evidence citation (file path + line, SQL policy name, or an explicit "not found in read window" statement).
7. Where evidence requires access this session does not have (live Supabase schema via secret key/service role, physical iPad Safari, real video/OTP provider, a live-browser walk of storyboards), the finding is marked **Unverifiable**, per CLAUDE.md's rule that unverifiable is never converted to a pass.

---

## 3. Twenty-finding matrix

Legend — Relationship: ExactDup / PartialDup / AddlEvidence / Conflict / New / Unverifiable. Action: Merge / Expand / NewDecision / Reject / Waiver.

| Ext# | Summary | Sev | Existing DEC | Relationship | Status/Owner | G5 gate | Channel | Blocks |
|---|---|---|---|---|---|---|---|---|
| 1 | Certification truth inconsistent (cert says complete, audit says coverage≠acceptance) | P0 | none direct | New | n/a | G5/G8 evidence | Shared | G5, Day-Zero, Release |
| 2 | No test/release-assurance system exists | P0 | DEC-010 (NFR) | AddlEvidence | Open / Architecture-Operations | G5/G8 | Shared/backend | G5, Release |
| 3 | Runtime doesn't match 38-route canonical contract | P1 | none direct | PartialDup (of STORYBOARD_STATUS 🔵 gap) | n/a (tracked) | G5/G6 | All 4 | Day-Zero |
| 4 | Storyboard authority split; business pack missing page 04 | P0 | none direct | Unverifiable | n/a | G5 | Shared | Day-Zero, Commercial |
| 5 | Persona/role authority unresolved (8/10/11/12/14 counts) | P0 | none direct | PartialDup / AddlEvidence | n/a | G5 | Shared | G5 |
| 6 | Every login routes to Admin; nav not role-aware; no sign-out | P0 | none direct | **Conflict** — not reproducible | n/a | G5/G6 | Web/iPad/Admin | none (superseded pending re-verify) |
| 7 | Workflow status can be bypassed by direct writes | **P0** | (ENG-03 contract, CLAUDE.md hard rule) | AddlEvidence | Open / Architecture | G5/G8 | Shared backend | G5, Release, Production |
| 8 | RLS/authorization policies too broad | **P0** | (RBAC contract, CLAUDE.md hard rule) | AddlEvidence | Open / Security | G5/G8 | Shared backend | G5, Release, Production |
| 9 | GPS failure converted to fabricated success coordinates | **P0** | DEC-002 (GIS accuracy) | AddlEvidence | Open / GIS-Operations | G5 before journey cert | iPad | G5, Day-Zero, Production |
| 10 | Offline submit shown as submitted/immutable before sync | **P0** | (ENG-10 offline, CLAUDE.md hard rule) | AddlEvidence (sub-claim A); Conflict (sub-claim B, hardcoded v1) | n/a | G5/G8 | iPad | G5, Day-Zero, Production |
| 11 | Violation/action-form generation is UI-only, no runtime insert | P0 | none direct | Unverifiable (partial evidence found) | n/a | G5/G8 | iPad/Web | Day-Zero, Production |
| 12 | Evidence/acknowledgement incomplete (photo-only, fake ack) | P0 | DEC-006 (evidence), DEC-009 (ack) | AddlEvidence | Open / Compliance-Security, Open / Legal-Product | G5/G7 | iPad/Virtual | G5, Day-Zero, Production |
| 13 | Virtual inspection not release-ready; dev OTP shown | P0 | DEC-007 (OTP provider) | AddlEvidence | Open / Technical-Security | G5 | Virtual | G5, Day-Zero, Production |
| 14 | Arabic/RTL not delivered; hardcoded en/ltr | P0 | DEC-004 (Arabic/RTL) | **Conflict** — not reproducible as stated | Open / Executive-Product (decision itself still open) | G6 design freeze | All 4 | G5 (decision), not implementation |
| 15 | Cloud/data-residency unresolved (Seoul) | P0 | none direct (NFR/DEC-010 adjacent) | Unverifiable | n/a | G5 | Backend | G5, Production |
| 16 | Product shell not commercially credible | P1 | none direct | Unverifiable (design judgment) | n/a | G6 | All 4 | Commercial readiness |
| 17 | Iconography/PWA assets effectively absent | P1 | none direct | PartialDup (manifest now has 3 icons, not 1) | n/a | G6 | iPad/PWA | Commercial readiness |
| 18 | Typography/density below showcase quality | P1 | none direct | Unverifiable (design judgment) | n/a | G6 | All 4 | Commercial readiness |
| 19 | Accessibility asserted, not certified | P0 | DEC-010 adjacent | Unverifiable | n/a | G5/G8 | All 4 | G5, Production, Compliance |
| 20 | iPad channel shallow PWA, no device certification | P0 | none direct | Unverifiable | n/a | G5/G8 | iPad | Day-Zero, Production |

---

## 4. Detailed evidence — the four mandated P0 integrity findings

### 4.1 Fake GPS fallback (external #9)

**Confirmed. Reproducible in current code.**

`apps/web/src/app/field/[visitId]/Startup.tsx`, function `checkIn()` (current line ~74-84):

```ts
const pos = await new Promise<GeolocationPosition | null>(res =>
  navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => res(p), () => res(null), { timeout: 4000 }) : res(null));
// demo fallback: 60m from official pin, good accuracy
const lat = pos?.coords.latitude ?? visit.factories.official_lat + 0.0005;
const lng = pos?.coords.longitude ?? visit.factories.official_lng + 0.0002;
const acc = pos?.coords.accuracy ?? 4.2;
```

When `navigator.geolocation` is unavailable, permission is denied, or the 4-second timeout elapses, `pos` resolves to `null`. The code then **substitutes a synthetic coordinate** (official pin +0.0005°/+0.0002°, ≈60m offset) and a **synthetic accuracy value of 4.2m** — a value tighter than the configured `maxAcc` default of 25m (`gis.gps_accuracy_checkin_max_m ?? 25`), meaning the fabricated reading **always passes** the accuracy gate that is supposed to block weak/absent GPS. The comment `// demo fallback` confirms this is deliberate placeholder behavior, not a bug.

**Consequence:** a device with no GPS, a denied permission, or a timeout produces a check-in event (`geo_events` insert, confirmed at the line following this block) that is **indistinguishable from a genuine, high-accuracy, in-range GPS fix**. This directly corrupts chain-of-custody / arrival evidence — the exact G8 hard rule CLAUDE.md prohibits ("never invent... geofence values"; error catalogue item "weak GPS" is defined in `governance/error_catalogue.csv` and is bypassed entirely by this fallback).

**Maps to:** DEC-002 (GIS accuracy/geofence, Open, P0). DEC-002 governs what the *threshold and policy* should be; this finding proves the *enforcement path is currently defeatable* regardless of what threshold DEC-002 ultimately sets. Not a duplicate — additional evidence that the enforcement mechanism itself needs a governed-override path (block/retry/approver+reason+audit), not silent substitution.

### 4.2 Offline submission displayed as already submitted and immutable (external #10)

**Partially confirmed; one sub-claim does not reproduce.**

`apps/web/src/app/field/inspection/[id]/Workspace.tsx`, function `submit()` (current line ~60-68):

```ts
async function submit() {
  ...
  await local.enqueue({ kind: "submit", inspection_id: inspection.id, version_number: nextVersion, snapshot,
    idempotency_key: key, acknowledgement: { name: "Factory representative", signed: true, ts: ... }, queued_at: ... });
  setSubmitted(true);
  setMsg(navigator.onLine ? fmt(strings.submitting, { v: nextVersion }) : strings.queuedOffline);
  processOutbox(onState);
}
```

`setSubmitted(true)` fires **synchronously**, immediately after the operation is enqueued locally and **before** `processOutbox` confirms server acknowledgement. Once `submitted` is true, the UI renders the `strings.submittedTitle` / `strings.submittedBody` immutable banner (line ~90: `{submitted && <div className="ax-banner ax-banner--immutable">...}`) and hides the editable form — **regardless of whether the server has actually accepted the submission**, and regardless of `navigator.onLine`. The `strings.queuedOffline` message is shown alongside this immutable banner rather than instead of it, so the user sees "submitted, locked" language even when offline. **Confirmed as stated.**

`inspection.status === "submitted"` also seeds initial `submitted` state directly from the last-known local/server status without a distinct "queued/pending sync" status value existing in the state model at all (`STM-IPAD-SUB` in `state_transitions.csv` should be checked for a `queued` state — not present in the read window).

**Sub-claim not reproduced:** the external assessment cites "lines 84 and 120 hard-code immutable v1." Current code computes `nextVersion` dynamically: `Math.max(0, ...(inspection.submission_versions ?? []).map(s => s.version_number)) + 1`. This is **not** hardcoded to 1 in the present codebase. Either the assessment was run against an earlier revision, or this sub-claim is stale. **Logged as Conflict**, not silently dropped — must not be cited as evidence of a version-numbering defect without re-confirming against a fresh read.

**Maps to:** no single existing DEC row; falls under CLAUDE.md's hard rule "never silently overwrite offline/server conflicts" and ENG-10 (Offline Sync). Recommend a **new proposed decision** (see §9) rather than folding into an existing DEC, since no register row currently owns "state model must have a distinct queued/pending-sync status."

### 4.3 Workflow states changed directly without a single enforced transition service/guard (external #7)

**Confirmed. Reproducible across at least 7 files.**

`grep` for direct `.update({ ..., status/planning_status: ... })` calls against Supabase from server actions finds no single transition function; every call site mutates state directly:

- `apps/web/src/app/visits/[id]/actions.ts:31,40,54,97` — `planning_status: "returned"/"published"/"cancelled"`, `status: "assigned"`, each gated only by an inline `.eq("planning_status", "...")` optimistic-concurrency check, not a shared guard function.
- `apps/web/src/app/admin/regulations/actions.ts:48` — `status: "published"`.
- `apps/web/src/app/planning/bulk/actions.ts:46-47`, `planning/single/actions.ts:47-48` — `planning_status: "published"` on `visits` and `status: "published"` on `visit_plans`, two separate unguarded writes in the same request with no transactional/guard wrapper visible.
- `apps/web/src/app/operations/actions.ts:23` — `status: next_status`, where `next_status` is a caller-supplied parameter with no visible enum/guard check in the read window.
- `apps/web/src/app/reviews/[id]/actions.ts:26` and `reviews/[id]/page.tsx:32` — `inspections.status = "under_review"/status` written directly from the review surface.
- `apps/web/src/lib/offline.ts:103` — `inspections.status = "submitted"` written from the client-side outbox processor.

No `ENG-03`/workflow-transition RPC, Postgres function, or trigger enforcing "allowed source state → allowed target state, by role, with required evidence and audit side-effect" was found in the 14 migration files or the `apps/web/src` tree in this read window. Each call site independently decides what the next status is and writes it. This matches the external finding precisely: **status mutation is scattered, not centralized**, and correctness depends on every call site individually getting the guard right — which the `visits` actions do partially (inline `.eq` checks) and several others (`operations`, `offline.ts`) do not.

**Consequence:** any code path that can reach one of these Supabase calls (including a future bug, or a role gaining unintended write access via §4.4) can force an inspection/visit/plan into a state with **no workflow-defined path to it**, no guaranteed audit entry, and no guaranteed side effects (notifications, SLA resets) — this is a direct violation of CLAUDE.md's hard rule "never mutate workflow status directly; use canonical transitions and guards."

**Maps to:** no single DEC row (this is an architecture/build gap, not a policy-value decision) — it is exactly the ENG-03 cross-cutting service the G5 doc (§13) says "must be established before feature screens." Recommend **new proposed decision or explicit G5/G8 blocking condition**, not merged into an existing DEC-*.

### 4.4 Overly broad database authorization policies for reviews and virtual participation (external #8)

**Confirmed. Exact match on `reviews_insert`; confirmed and extended for `virtual_participants`, `vs_read`.**

`supabase/migrations/0002_rbac_audit.sql:75`:

```sql
create policy reviews_insert on reviews for insert with check (has_any_role(array['reviewer','ops']) or auth.uid() is not null);
```

The `or auth.uid() is not null` clause makes the entire `has_any_role` check meaningless — **any authenticated user, regardless of role, can insert a `reviews` row**, matching the external finding word-for-word.

`supabase/migrations/0002_rbac_audit.sql:81`:

```sql
create policy vp_rw on virtual_participants for all using (auth.uid() is not null) with check (auth.uid() is not null);
```

`for all` (select/insert/update/delete) gated only on `auth.uid() is not null` — **any authenticated user can create, read, update, or delete any row in `virtual_participants`**, including participants of sessions they are not invited to. This directly contradicts RBAC-014 (`domain/rbac_matrix.csv`: "Factory Representative ... Own appointment/session only").

`supabase/migrations/0002_rbac_audit.sql:78`:

```sql
create policy vs_read on virtual_sessions for select using (auth.uid() is not null);
```

Any authenticated user can read any virtual session row, not just their own.

**Consequence:** an authenticated Inspector, Planner, or Factory Representative account (any role, since the checks degrade to "logged in") can insert fabricated review decisions or read/write other factories' virtual-session participant data. This is a direct privilege-escalation / cross-tenant-data-exposure path, and is exactly the class of defect CLAUDE.md and the RBAC contract (`rbac_matrix.csv`, RBAC-011/RBAC-014) are meant to prevent.

**Maps to:** no single DEC row owns "RLS policy correctness" as a decision (it's an implementation defect against an already-decided RBAC contract, not an open policy value). Recommend a **new proposed decision / explicit P0 blocker**, distinct from DEC-005 (factory-facing boundary, which is about *what* factory reps may do, not *whether the database enforces it*).

### Summary of the four P0s

| # | Can it corrupt evidence? | Can it permit unauthorized action? | Can it create an invalid workflow state? | Can it misrepresent submission status? |
|---|---|---|---|---|
| GPS fallback | **Yes** — fabricated arrival/location evidence | No | Indirectly (passes gates that should block) | No |
| Workflow bypass | Indirectly | Indirectly (no guard = no role check guarantee at every site) | **Yes** — direct | No |
| Broad RLS | No | **Yes** — direct (any auth'd user: insert reviews, read/write virtual participants) | Indirectly | No |
| Offline submit | No | No | No | **Yes** — direct, before server ack |

None of the four is disproven. None is closed. All four remain **Open** and are **not merge-able into an existing DEC-* as a duplicate** — each is logged as additional evidence against an existing decision (or a new proposed decision where none exists) per the explicit instruction not to administratively close P0 integrity items.

---

## 5. Persona and storyboard impact matrix

| External # | Personas affected | Storyboards (SB#) affected | Channel |
|---|---|---|---|
| 6 (nav, login) | All 8 human personas | SB02 (Persona Atlas), SB01/19/20 (umbrella) | Web/Admin/iPad |
| 7 (workflow bypass) | Planner, Ops, Level 2 Reviewer, Inspector, System Services | SB04, SB05, SB10, SB16, SB17 | Web/iPad/Admin |
| 8 (broad RLS) | Level 2 Reviewer, Factory Representative | SB10 (Review), SB09 (Virtual Execution) | Web/Virtual |
| 9 (GPS fallback) | Inspector | SB06 (Pre-Start), SB07 (Physical Start Journey), SB14 (Journey Telemetry) | iPad |
| 10 (offline submit) | Inspector, Level 2 Reviewer (receives false-final version) | SB08 (Execution Workspace), SB16 (Submission/Locking/Version) | iPad |
| 11 (violation gen) | Inspector, Compliance Admin, Factory Representative | SB15 (Evidence/Violations/Penalties/Actions) | iPad/Admin |
| 12 (evidence/ack) | Inspector, Factory Representative | SB15 | iPad/Virtual |
| 13 (virtual OTP) | Inspector, Factory Representative | SB09 (Virtual Execution) | Virtual |
| 14 (Arabic/RTL) | All 8 human personas | SB19 (Web+Inspector IA, umbrella) | All 4 |

Per `STORYBOARD_STATUS.md`, **SB08 (184 rows), SB09 (20 rows), SB05/SB06 are 0% 🟢** ("code complete on live schema; journey not yet walked in browser") — meaning the offline-submit, GPS check-in, and virtual-OTP defects above sit inside storyboards that have **never been walked live**. This is consistent with the external assessment's core claim: these are code-present, browser-unverified paths, exactly the risk category `STORYBOARD_STATUS.md`'s own reading rule warns about ("🔵 means the code exists... treat as risk, not credit").

---

## 6. Requirement / acceptance-criteria impact

The 478-row `atomic_scope.csv` was not individually cross-walked in this pass (out of scope for reconciliation; that is the G5→G8 traceability-ledger workstream the external assessment itself recommends as Iteration 1 step 2). What can be stated with evidence:

- Findings #7, #8, #9, #10, #12, #13 each map to **CLAUDE.md hard rules** directly (workflow guard, offline conflict, geofence invention, evidence linkage) — these are contract-level, not merely code-quality, violations.
- Finding #9 maps to the "weak GPS" and "outside geofence" rows in `governance/error_catalogue.csv` (§9 of the G5 doc lists 17 error contracts including these) — the fallback code means those two error contracts are currently **unreachable** for the no-signal case, since a fabricated reading is always supplied instead of triggering the error path.
- Finding #10 maps to the `state_transitions.csv` "Offline Queue" state machine (§7 of G5 doc: 9 state machines / 23 transitions) — whether a `queued`/`pending_sync` status literal exists in that machine was not confirmed in this read window and is logged as **evidence still required** (§8 below).
- No acceptance-ID-to-finding mapping can be produced without opening `atomic_scope.csv`/an acceptance ledger and matching row-by-row; flagged as required follow-up, not fabricated here.

---

## 7. Conflicts with current G5 assertions

1. **G5 doc headline ("no application code... nothing to reverse-engineer") is stale.** The repository now contains `apps/web/` (Next.js 15, React 19, Supabase SSR client), 14 SQL migrations, and 29 route directories, built across commits `b7abb8c`→`0ea7bc9` (2026-07-11, same date as the G5 report). The G5 architecture report must be **regenerated against actual code**, not treated as still describing a greenfield repo. This is the single highest-leverage correction from this reconciliation.
2. **External finding #6 (role-unaware nav, no sign-out) does not reproduce.** `apps/web/src/app/launch/page.tsx` implements a real role router (`inspector→/field`, `reviewer→/reviews`, `planner→/planning`, `ops`/`leadership→/operations`, fallback `/admin`), and sign-out handlers exist in `Shell.tsx`, `FieldTabs.tsx`, `field/page.tsx`. `STORYBOARD_STATUS.md` independently corroborates this ("SB02 ... realized via /launch role-routing ... verified live"). **Conflict logged, not closed** — needs a live-browser walk to confirm the router is reachable from `/login` and `/` in all cases, but the code-level claim in the external assessment is not currently accurate.
3. **External finding #14 (hardcoded `lang=en dir=ltr`) does not reproduce at the code level.** `apps/web/src/app/layout.tsx:29` renders `<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>` driven by `getLocale()`, an `IBM_Plex_Sans_Arabic` font is loaded, and an `admin/localization` draft→reviewed workflow exists. **This does not close DEC-004** — the decision (English-only vs. bilingual vs. selected-Arabic-surfaces scope) is still `Open` in the register, and building bilingual infrastructure ahead of that decision is itself a process risk worth flagging (§9). Logged as Conflict on the implementation claim, not a resolution of the governance decision.
4. **External finding #10's "hardcoded v1" sub-claim does not reproduce** (§4.2) — version numbering is computed dynamically in current code.
5. **External finding #17 (manifest has 1 icon)** — current `apps/web/public/manifest.json` lists 3 icons (`icon.svg`, `icon-192.png`, `apple-touch-icon-512.png`). Partial duplicate, not a clean match — some gap remains (no documented maskable-icon/screenshot/shortcut set was found), but the "one icon only" claim is stale.

None of these conflicts should be read as "the external assessment is wrong and can be discarded" — three of the four P0 mandated findings were fully confirmed. The conflicts instead show the codebase is **actively moving underneath both documents**, which is itself evidence that G5 evidence needs to be regenerated from the current tree rather than reasoned about from either document's snapshot.

---

## 8. Unverifiable items and evidence still required

Per CLAUDE.md/G5 exit condition, none of the following may be converted to a pass without the missing access:

- **Live Supabase schema** (findings #1, #2, #15, #19, #20 partially depend on this) — blocked pending secret key/service-role/PAT, per G5 doc §12. `get_advisors`/`list_tables` MCP tools are available but require Supabase auth this session does not have.
- **Physical iPad Safari certification** (#20) — no device available in this session.
- **Real video/OTP provider behavior** (#13) — provider not selected (DEC-007), currently dev-code-only.
- **Business/investor storyboard pack page 04** (#4) — a zip (`${INSPECTION_DOCS_ROOT}/05_UI_UX_AND_STORYBOARDS/MIM_Inspection_MVP1_Historical_Archives_v3/MVP1_Business_User_Storyboard_Pack_Current.zip`) exists but was not extracted/inspected in this pass.
- **Accessibility (WCAG 2.2 AA) audit** (#19) — no automated or manual audit run in this session; asserted by neither document with evidence, only intent.
- **Runtime violation/action-form instance generation** (#11) — config-side tables (`violation_codes`, `penalty_mappings`) and inserts exist (`admin/violations/actions.ts`), but whether a non-compliant inspection response actually triggers a runtime `violations`/`action_forms` row insert (as opposed to only a UI message, per the external claim) was not confirmed by tracing the review-decision path fully in this pass.
- **`FINAL_CERTIFICATION.md` vs `design/astryx/d9/D9_FINAL_AUDIT.md` consistency** (#1) — both files exist (confirmed present) but their content was not diffed line-by-line in this pass; the inconsistency claim is plausible given the same "coverage ≠ acceptance" pattern seen in `STORYBOARD_STATUS.md`'s own 🔵-vs-🟢 distinction, but not independently re-verified here.
- **Region of the live Supabase project** (#15) — G5 doc itself records "region unknown."

---

## 9. Newly proposed decisions (not existing DEC rows)

These findings have no existing register owner and should not be forced into one:

- **NEW-DEC-A — Canonical workflow-transition enforcement.** Owns: a single server-side (RPC/trigger) transition function per state machine, replacing the 7+ scattered direct `.update({status})` call sites found in §4.3. Authorizes/blocks: Iteration 1 P0 containment.
- **NEW-DEC-B — RLS policy correctness pass.** Owns: closing the `or auth.uid() is not null` and `for all using (auth.uid() is not null)` escape hatches found in `reviews_insert`, `vp_rw`, `vs_read`, and any sibling policies not yet audited. Distinct from DEC-005 (which decides *scope*, not *enforcement*).
- **NEW-DEC-C — Offline "queued/pending sync" status literal.** Owns: adding a distinct pre-server-ack status so the UI never shows the immutable-submitted banner before server acknowledgement. Sits under ENG-10, adjacent to DEC-006.
- **NEW-DEC-D — Evidence integrity/traceability regeneration cadence.** Owns: a rule that `docs/G5_ARCHITECTURE_AND_READINESS.md`, `FINAL_CERTIFICATION.md`, and `STORYBOARD_STATUS.md` must be regenerated (not hand-asserted) whenever `apps/web/src` or `supabase/migrations` changes materially, to prevent the staleness documented in §7.

---

## 10. Revised G5 blocking list

Original 10 DEC-* rows remain **Open** (unchanged; no evidence in this pass resolves any of them). Add:

11. **G5 architecture report is stale against current repository state** — must be regenerated (§7.1) before G5 evidence can be trusted.
12. **Four confirmed P0 integrity defects** (§4) must be either fixed-and-retested or formally logged as blocking, per CLAUDE.md — they may not be waived silently.
13. **NEW-DEC-A/B/C/D** (§9) require disposition (accept as new decisions, reject with evidence, or fold into an existing DEC with an explicit patch — see `docs/proposals/G5_DECISION_REGISTER_PATCH.csv`).
14. **Live Supabase schema reconciliation** remains blocked on credentials (unchanged from G5 doc §12).
15. **Route/persona/storyboard count reconciliation** (#3, #5) should be closed out via the traceability-ledger workstream before G5 evidence is called complete, not left as an unowned observation.

**G5 open-blocker count: 10 existing DEC rows + 5 items above = 15.**

---

## 11. Recommended Iteration 1 scope (proposal only — no task-router entries created)

### 11.1 P0 containment and evidence-integrity corrections
- Fix GPS fallback (§4.1): remove synthetic coordinate/accuracy substitution; on `pos === null`, surface the existing "weak GPS" error contract and block check-in, or require an explicit governed override (reason + approver + audit) — **not** silent substitution. *Depends on:* DEC-002 disposition for the accuracy threshold value. *Evidence required:* updated `Startup.tsx`, a passing negative-path test/manual walk with geolocation denied, an audit-event row for any override path. *Acceptance:* no `geo_events` row can be created with a fabricated position. *Affects:* `Startup.tsx`, `error_catalogue.csv` row "weak GPS". *Authorized by:* DEC-002 (existing) + NEW-DEC-A pattern for the override path.
- Fix offline-submit state (§4.2): introduce a `queued`/`pending_sync` UI/status distinct from `submitted`; only show the immutable banner after confirmed server ack. *Depends on:* NEW-DEC-C. *Evidence required:* `state_transitions.csv` updated with the new status if not already present; `Workspace.tsx` diff; offline walk-through. *Acceptance:* submitting offline shows "queued", never "submitted/immutable", until sync confirms. *Affects:* `Workspace.tsx`, `offline.ts`, `state_transitions.csv`.
- Centralize workflow transitions (§4.3): one transition function per state machine; migrate the 7 call sites to call it. *Depends on:* NEW-DEC-A. *Evidence required:* SQL function/RPC + migration, refactored `actions.ts` files, negative-path test (attempt an invalid transition, expect rejection+audit). *Acceptance:* no direct `.update({status})` remains outside the transition layer. *Affects:* all `*/actions.ts` files listed in §4.3, new migration.
- Tighten RLS (§4.4): remove the `or auth.uid() is not null` escape hatch on `reviews_insert`; scope `vp_rw`/`vs_read` to session participants/assigned roles only. *Depends on:* NEW-DEC-B, and confirming RBAC-011/RBAC-014 intent against `rbac_matrix.csv`. *Evidence required:* updated migration, attack test (non-participant attempts insert/select, expect denial). *Acceptance:* attack tests in G5 doc §8/error catalogue "unauthorized action" pass. *Affects:* `supabase/migrations/0002_rbac_audit.sql` (new migration, not an edit to a frozen one).

### 11.2 G5 architecture/readiness closure
- Regenerate `docs/G5_ARCHITECTURE_AND_READINESS.md` against actual `apps/web/` + `supabase/migrations/` state (§7.1). *Depends on:* nothing (pure discovery). *Evidence:* new report section replacing §1/§13 headline claims. *Acceptance:* report accurately states code exists, lists real route/table inventory. *Affects:* `docs/G5_ARCHITECTURE_AND_READINESS.md` only.
- Obtain Supabase secret key/service-role/PAT and complete live-schema reconciliation (`docs/G5_LIVE_SCHEMA_RECONCILIATION.md` exists but is incomplete per G5 doc §12). *Depends on:* human action (credential). *Blocks:* full G5 evidence closure.
- Disposition NEW-DEC-A/B/C/D and the route/persona/storyboard count gaps (#3, #5) through the decision-register patch process (§ below), not silently.

### 11.3 Persona, storyboard, and acceptance execution
- Walk SB05, SB06, SB08, SB09 live in a browser (currently 0% 🟢 per `STORYBOARD_STATUS.md`) — these are exactly the storyboards containing the confirmed P0 defects. *Depends on:* 11.1 fixes landing first, or explicit acknowledgement that the walk will reproduce the defects (useful either way as evidence). *Evidence:* updated `STORYBOARD_STATUS.md`/`AC_LEDGER.csv` rows moving 🔵→🟢. *Acceptance:* per existing reading rule, "DONE only when every row is 🟢."
- Reconcile persona/role counts (#5) against BRD and role-reference documents referenced by the external assessment (not located in this repo pass — request from user or locate in historical archive).

### 11.4 Cross-channel continuity (iPad, admin, web)
- Confirm `/launch` role router is reachable from every entry point (`/`, `/login`) and that no path bypasses it to land non-admin roles on `/admin` (partially disproves #6, but full entry-point coverage not confirmed). *Evidence:* route-level walk of `/`, `/login`, `/launch` for each of the 8 personas.
- Confirm runtime violation/action-form generation end-to-end (#11, currently Unverifiable) — trace from a `non_compliant` response through review decision to a `violations`/`action_forms` row.

### 11.5 Reserved for Iteration 2 (commercial readiness — do not schedule now)
- Findings #1 (cert-vs-audit dashboard), #4 (business storyboard pack), #15 (cloud residency/NDMO), #16 (commercial shell), #17 (icon/PWA asset completeness), #18 (typography/density), #19 (WCAG certification), #20 (physical iPad device certification) — all require either a formal decision (#15), a design system freeze at G6 (#16-18), a real audit run (#19), or hardware access (#20), none of which are available or authorized pre-G5/G6.

---

## 12. Explicit prohibition statement

Per the user's instruction and CLAUDE.md, the following remain **prohibited** until G5 passes and any subsequent gate/human approval is obtained:

- No code fix from §11.1 has been applied. All four confirmed P0s remain **open defects in the running application** as of this document.
- No entry in `product-contract/governance/decision_register.csv` has been edited, closed, renumbered, or superseded. All 10 rows remain exactly as read.
- No task-router (`TASK_ROUTER.yaml`) entries have been created for any item in §11.
- No stack, provider, threshold, SLA, legal, risk-weight, geofence, retention, or Arabic-scope value has been invented anywhere in this document; every DEC-* remains `Open`.
- `docs/proposals/G5_DECISION_REGISTER_PATCH.csv` is a **proposal only** and must not be applied without explicit human approval.

---

## Completion summary

- **Exact duplicates:** 0
- **Partial duplicates:** 3 (#3 route-count gap already tracked in STORYBOARD_STATUS; #5 persona-count gap partially reconciled by current `personas.yaml`/`rbac_matrix.csv`; #17 icon-count claim partially stale)
- **Conflicts (finding does not reproduce as stated against current code):** 4 (#6 role-aware nav/sign-out; #14 Arabic/RTL hardcoding claim; #10's hardcoded-v1 sub-claim; #17's "one icon" sub-claim, double-counted with partial-dup above since it is both partially true and partially stale)
- **Genuinely new findings (no existing DEC owner, not previously tracked):** 6 (#1, #2, #4 [pending zip inspection], #7, #8, and the composite "G5 doc premise is stale" finding raised in this reconciliation, §7.1)
- **Unverifiable (access/evidence not available this session):** 9 (#1 partial, #4, #11 partial, #13's provider-side claims, #15, #16, #18, #19, #20)
- **Revised open G5 blocker count:** 15 (10 existing DEC rows + 5 new items in §10)

**The four P0 integrity conclusions:**
1. **Fake GPS fallback — CONFIRMED.** Can corrupt inspection arrival/location evidence. `Startup.tsx` checkIn(), synthetic lat/lng/accuracy on geolocation failure.
2. **Direct workflow-state bypass — CONFIRMED.** Can create invalid workflow states / bypass role guards at 7+ call sites. No centralized ENG-03 transition function found.
3. **Overly broad RLS — CONFIRMED.** Can permit unauthorized action. `reviews_insert` literally allows any authenticated user (`or auth.uid() is not null`); `vp_rw`/`vs_read` on `virtual_participants`/`virtual_sessions` are equivalently broad.
4. **Offline submission shown as submitted — CONFIRMED (core claim); one sub-claim stale.** Misrepresents submission status to the user before server acknowledgement. The "hardcoded v1" sub-claim did not reproduce against current code and should not be cited further without re-verification.

**Recommendation: G5 must remain FAILED / cannot conditionally pass.** Four independently reproduced P0 integrity defects exist in running code, all ten existing decisions remain open, and the architecture report this gate depends on is stale relative to the current repository. G5 can be reconsidered only after: (a) the architecture report is regenerated against actual code, (b) the four P0s are fixed-and-retested or formally logged as signed, time-boxed waivers (not silently deferred), and (c) the decision-register patch in `docs/proposals/G5_DECISION_REGISTER_PATCH.csv` is reviewed and dispositioned by the named owners.
