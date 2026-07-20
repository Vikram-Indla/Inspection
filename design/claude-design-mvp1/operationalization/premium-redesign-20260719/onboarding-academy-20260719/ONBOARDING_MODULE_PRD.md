# ONBOARDING_MODULE_PRD — Persona Academy & Platform Learning System

**Document ID:** OBM-PRD-20260719-001
**Status:** CONTROLLED PROPOSAL — content-system definition only. No visual screens, no code, no ledger edits.
**Owner package:** `CD-PREM-02` (per `MASTER_UIUX_OPERATIONALIZATION_PLAN.md` §10)
**Canonical repository:** `/Users/vikramindla/Developer/Inspection`
**Programme rule honored:** this document adds learning content definitions over the implemented MVP1/MVP2/MVP3 platform. It never invents product behaviour, never proposes role switching, and never upgrades a provider-dependency or partial row.

---

## 1. Truth-class legend (used in every deliverable of this pack)

| Class | Meaning |
|---|---|
| `IMPLEMENTED` | Behaviour proven in `product-contract/CURRENT_STATE.md`, `GATE_STATUS.md`, or the acceptance ledger (493 rows: 18 verified_live / 475 implemented / 0 partial / 0 missing at UPDATE 88; later reconciliations note 15/460/18 — cite the ledger, not this PRD, for the live count). Learning content may state it as product truth. |
| `IMPROVEMENT` | UX/learning gap on top of implemented behaviour; fixable inside CD-PREM-02 without behaviour change. |
| `PROPOSAL` | New learning-system capability (e.g., progress tracking) requiring design + change control before build. |
| `MEDIA_DEP` | Blocked on produced media (filmed chapters, posters, VO, captions). Poster/text fallback must ship first. |
| `PROVIDER_DEP` | Blocked on a fail-closed external provider (video, notifications delivery, Google Routes, signature/PKI, SSO, AI, MDM, retention). Content must teach the honest unavailable state, never simulate the provider. |
| `SPONSOR_DECISION` | Requires explicit sponsor/governance approval (e.g., Minister persona naming, Committee role binding, Vision 2030 brand usage, learning-analytics targets). |

## 2. Problem

`[Certain]` The platform is functionally deep (59 implemented routes, 13 roles, 5 state domains, offline outbox, immutable versions, audit flight recorder) but nobody outside the build team can explain it. `CURRENT_STATE.md` contains **zero** onboarding/help/learning features today (only `persona-tours.spec.ts` as a test artifact). The Master Plan (§11) mandates a Persona Academy in the side panel. This PRD defines that content system.

## 3. Non-negotiable product constraints (all `IMPLEMENTED` truth)

1. **Academy never switches authorization.** Clicking a persona opens learning material about that persona. The viewer's own role, RLS scope and session are untouched. No impersonation, no role preview, no demo-role tokens. (Master Plan §3 exclusions; REC-017 acceptance test.)
2. **Minister = existing `leadership` boundary.** No new runtime role is created or implied (REC-024; Master Plan §3). Content may use the display label "Minister / Leadership" only as a learning label, flagged `SPONSOR_DECISION` for final naming.
3. **Provider truth is taught, not patched.** Learning content must show: `/operations/live` movement is projected, not GPS; virtual room has live OTP/state/audit but no video provider; Google Routes adapter renders honest unavailable; notifications are "queued, not confirmed delivered"; acknowledgement is "unverified, never labelled PKI"; AI destinations are hidden; `/visits` map lens is UNAVAILABLE with the list as working equivalent.
4. **Immutability and conflict rules appear in content exactly as implemented:** submitted versions are immutable; one open review per submission version; returned scope is the only editable scope; offline conflicts are never silently overwritten.
5. **Arabic-first, bilingual, RTL.** The app defaults to `lang=ar` / `dir=rtl` at `/login`; ui_strings has 1,815 translated rows with Arabic pending qualified human review. All Academy content ships EN + AR with true RTL. Native Arabic linguistic approval is an OPEN human gate (`CURRENT_SLICE.yaml` open_decisions) — Academy Arabic scripts inherit that same review gate.
6. **Accessibility floor = the platform's certified floor:** WCAG 2.2 A/AA technical pass, 320px reflow, keyboard/focus, landmarks, RTL physical mirroring, reduced motion. Academy media adds captions, transcript, audio description, poster fallback, no audible autoplay (REC-020).

## 4. Placement and information architecture

`[Certain — placement mandated by Master Plan §11]`

- Side panel gains one destination: **"Learn the platform" (تعلَّم المنصة)** — a navigation entry, not a role switcher. Exact side-panel slot and iconography are Claude Design decisions (`CD-PREM-02`), not this PRD's.
- The destination lists governed personas with human-readable names and job outcomes. Selecting a persona opens the persona's learning space containing, per Master Plan §11:
  1. a 20–45s real-character chapter or approved poster fallback (`MEDIA_DEP`);
  2. a "your day" storyline;
  3. what the persona can see and cannot do (from implemented RBAC truth);
  4. the journey map and next/previous handoff;
  5. short task demonstrations linked to live routes;
  6. downloadable visual material and transcript;
  7. progress, revisit and accessibility controls (`PROPOSAL` — progress persistence needs design + change control).

## 5. Persona catalogue

### 5.1 Governed personas (launch set — 13, matching the governed role/persona source in Master Plan §11)

| Academy ID | Display name (EN) | Implemented role key evidence | Primary route family |
|---|---|---|---|
| PA-ADM-COMP | Compliance Admin | `admin@mim.gov.sa` persona; `/admin` scope band | `/admin/regulations`, `/admin/items`, `/admin/violations` |
| PA-ADM-FORM | Form Admin | admin family | `/admin/items`, `/admin/packages` |
| PA-ADM-WF | Workflow Admin | admin family | `/admin/workflows` |
| PA-ADM-RISK | Risk Owner | admin family | `/admin/risk`, `/admin/risk/models` |
| PA-ADM-GIS | GIS Admin | admin family | `/admin/gis`, `/admin/gis/spatial` |
| PA-ADM-SEC | Security Admin | admin family | `/admin/access`, `/admin/security-access`, `/admin/devices` |
| PA-PLN | Planner | `has_role('planner')` server guard (RBAC-007) | `/planning*`, `/visits*` |
| PA-OPS | Operations | `ops` role key; Operations dashboard destination | `/operations`, `/operations/live`, `/operations/exceptions`, `/dashboard` |
| PA-INS | Inspector | `inspector` role key; field workspace | `/field`, `/field/:visitId`, `/field/inspection/:id`, `/planning/immediate`, `/virtual/:id` |
| PA-REV | Reviewer | `reviewer` role key; `canDecide` = reviewer/ops | `/reviews`, `/reviews/:id` |
| PA-AUD | Auditor | `auditor` in reviews read-authorized set | `/admin/audit`, `/reviews/:id` (read-only lozenge) |
| PA-LEAD | Minister / Leadership | `leadership` role key; `/dashboard`; Factory 360 contact masking is leadership-scoped | `/dashboard`, `/factories/:id`, `/visits` (read) |
| PA-FREP | Factory Representative | external participant in virtual session + portal surface | `/portal`, `/virtual/:id` (participant) |

`[Likely]` The admin-family personas (rows 1–6) currently share the `admin` runtime authorization; the Academy presents them as distinct *jobs* over shared admin routes, which is a content decision, not a role claim. If the 13-role enum in migration 0001 names them differently, the Academy display names re-map to that enum before build (open verification item OV-01 in the handoff YAML — a repo-truth check, not a Kimi dependency).

### 5.2 Reconciliation set (content held until governance confirms role binding — all `SPONSOR_DECISION`)

| Academy ID | Display name | Trigger route evidence | Blocker |
|---|---|---|---|
| PA-COM | Committee | `/committee` (RTE-034), `/cases` (RTE-033) | Runtime role mapping not confirmed in CURRENT_STATE; Committee/Committee Secretary (R7) exists in BRD RBAC registry |
| PA-ENF | Enforcement / Compliance Officer | `/enforcement` (RTE-043) | Same — BRD approval chain (Branch Manager → Sector Manager → Compliance) has no confirmed runtime role keys; `HANDOFF_BLOCKED_ROLE_MAPPING` precedent (Branch Manager) |
| PA-INT | Integration Admin | `/admin/integrations` (RTE-040) | Strategic-source persona; Master Plan §11 requires reconciliation before inclusion |
| — | Investor, Risk Approver | none implemented | Strategic-source only; excluded from launch set |

## 6. Content system — module types

Seven content types; every instance is a row in `PERSONA_ACADEMY_CONTENT_MATRIX.csv` with truth class, routes, states, languages, accessibility assets and media state.

| Type code | Type | Duration | Notes |
|---|---|---|---|
| CH | Persona chapter film | 20–45s | Real-character; poster fallback mandatory (`MEDIA_DEP`) |
| DAY | "Your day" storyline | 2–4 min read | Text+stills first; film optional later |
| SCOPE | Can-see / cannot-do card | static | Generated from implemented RBAC truth only |
| JMAP | Journey map + handoffs | static/interactive | Plan→Prepare→Inspect→Prove→Decide→Improve lens |
| TASK | Task demonstration | 60–120s | Screen capture of the real route/state; every TASK names route, persona, product version |
| EXPL | Visual explainer | 90–180s | Concept pieces (immutability, offline outbox, provenance, review return) |
| HELP | Contextual micro-guide | ≤30s / text | Surfaced at first-use decision points (REC-021), revisitable, never blocking |

## 7. Required flagship journeys

### 7.1 Inspector learning journey (execution-spec lives in `VIDEO_SCRIPTS_AND_STORYBOARDS.md` §3; storyline mapping in `FOUR_HOUR_PLATFORM_STORYLINE.md` Act 2–4)

Ordered stages, each mapped to implemented truth:

1. **Assignment & preparation** — `/field` workspace; assigned visits; pre-start lock (`status !== "not_started"`); Factory 360 context at `/factories/:id`.
2. **Route & geofence truth** — projected route labeling (never presented as live GPS); Google Routes honest-unavailable state; geofenced arrival; **geo-override truth:** one attempt, expires after 30 minutes or visit close, only Operations may decide, self-decision blocked (`request_geo_override` RPC).
3. **Physical inspection** — `/field/:visitId`, `/field/inspection/:id`; arrival cards; valid-next-action discipline (REC-040).
4. **Virtual inspection** — `/virtual/:id`; OTP/verified-gate (CD-042), timeline, provider-pending bounded room; S15 offline = begin/reschedule/close disabled, nothing queued.
5. **Evidence** — arrival photo/comment; finding-linked capture (REC-043 as `IMPROVEMENT`); chain-of-custody visibility (REC-042).
6. **Offline / sync / conflict** — real offline outbox; queued→replay; stale-replay guard; conflict never silently overwritten; sync states saved/queued/syncing/synced/failed/conflict (REC-041).
7. **Submission** — immutable submitted version; pre-submit proof summary (`IMPROVEMENT`, REC-044).
8. **Review return & correction** — returned_sections scope; only returned scope editable; correct → resubmit → approve (golden journey: plan→publish→execute→submit→return→correct→resubmit→approve).

### 7.2 Minister/Leadership onboarding chapter

Covers, all against implemented truth:

- **Map/list:** synchronized map+list is `IMPROVEMENT` (REC-025/031); today `/visits` map lens is UNAVAILABLE and the list is the working equivalent — the chapter teaches that honestly.
- **Metrics:** `/dashboard` Strategic + Operational views; governed KPIs (performance, compliance, approval, violations, operational KPIs, deterministic alerts, workload, cancellations, GPS-override comparison, audit timeline).
- **Provenance & freshness:** metric definition, numerator/denominator, lineage and drilldown (REC-026; Master Plan §12).
- **Authorized conversational AI:** taught as **`AI briefing not enabled`** — the implemented state. Composer, preset questions, citations, uncertainty and cannot-answer are adapter-ready spec only (`PROVIDER_DEP` + `SPONSOR_DECISION`). The chapter never shows a fabricated answer.
- **Uncertainty & unavailable states:** annual target/year eligibility, presence, absolute capacity, stuck-duration and missing-confirmation fields render explicit unavailable states — the chapter shows these as designed honesty, not defects.

## 8. Four-hour demonstration + derivatives

Defined in `FOUR_HOUR_PLATFORM_STORYLINE.md`: 24 chapters / 6 acts on the Plan→Prepare→Inspect→Prove→Decide→Improve spine, each chapter mapped to routes (RTE-IDs), states and truth labels; plus a 30-minute executive cut (8 chapters) and a 10-minute leadership cut (4 segments). REC-023 acceptance: the platform can be demonstrated sequentially without skipping governed journeys.

## 9. Versioning, release linkage, analytics

- **Content versioning:** every content item carries `content_version`, `product_commit`, `routes_referenced`, `capture_date`, `language_set`, `media_state`. A content item is stale when any referenced route/state changes in a release; release notes must list impacted item IDs. (`PROPOSAL` — needs a lightweight content register; format proposed in `VIDEO_SERIES_BIBLE.md` §9.)
- **Release linkage:** Academy items bind to the release tag they were captured against (current: `g11-g12-release-2026-07-16`); re-certification of TASK captures is part of each release checklist.
- **Learning analytics:** collect only completion/revisit/drop-off per item and per persona space. **No targets are set in this pack** — target-setting is `SPONSOR_DECISION`; inventing adoption/completion KPIs is prohibited by the no-invented-metrics rule.

## 10. Out of scope for this PRD

Final visual screens, component specs, code, route changes, RBAC changes, any programme-ledger edit, provider activation, production media procurement (brief only, in `CASTING_LOCATION_PPE_AND_RIGHTS_BRIEF.md`).

## 11. Acceptance

Binding criteria live in `ONBOARDING_ACCEPTANCE_CRITERIA.csv` (OB-AC-001..040). Headline: Academy opens without changing authorization; every persona space traceable to governed roles/routes; every media item has poster/transcript/caption/AD/reduced-motion equivalents; every truth label honest; EN/AR/RTL parity; no invented metric, provider, role or target.
