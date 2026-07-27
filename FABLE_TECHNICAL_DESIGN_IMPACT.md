# FABLE_TECHNICAL_DESIGN_IMPACT — What the Understanding Forces on Future Design

Status: analysis only. **No retired predecessor artifact or product screen created.** Mobbin excluded. Historical archives = provenance only. Meta-retired predecessor = design direction only, unapproved until G6. Open decisions DEC-001..010 not invented — every impact below is stated conditionally where a decision gates it.

---

## 1. Impacts that are non-negotiable regardless of open decisions

These follow directly from frozen contracts (repo `product-contract/*`) and bind any future design:

1. **Twelve mandatory screen states are a component-system requirement, not per-screen polish.** Every screen must express loading / empty / populated / validation failure / unauthorized / read-only-immutable / stale / degraded / offline / syncing / conflict / success where relevant (screen catalogue `states` column; retired predecessor "Non-negotiable states"). → Design system must ship state variants at the component level (tables, panels, forms, maps) or 38 screens × 12 states becomes unmanageable.
2. **Status is never free-styled.** Five separate state domains (planning, operational, review, virtual, sync — BRD §9; FND-002) must be visually distinguishable and never merged in one status chip. → A status/lozenge taxonomy keyed to state domain is a foundation component.
3. **Immutability must be visible.** Submitted versions, published configs, reviewer comments, audit trails are read-only by contract (CLAUDE.md hard rules) → immutable/read-only banner + version badge are first-class components, appearing on SCR-WEB-310/320, SCR-IPAD-670, all published-config admin views.
4. **Offline/sync state is persistent chrome on iPad.** Inspector must always see offline / pending / syncing / synced / conflict / failed (iPad spec §4) → app-shell-level indicator + conflict-resolver surface, not a toast.
5. **Selective unlock is a UI primitive.** Return scope drives per-section editability (STM-REV-003, SCR-IPAD-670) → section containers need locked/unlocked/corrected visual states and a diff/comparison view (SCR-WEB-320).
6. **Control-plane pattern for Admin.** Left hierarchy, central editor/canvas, right validation/inspector panel, draft/published context, dependency-impact warnings before publish (Admin spec §7). Plain table+modal admin is contractually rejected.
7. **Evidence is always linked.** Capture UI must force item/finding linkage and show chain-of-custody metadata; loose upload is rejected (P08 failure controls; ENG-07 forbidden shortcut).
8. **Fault isolation layout.** Ops Center and Factory 360 must degrade per-widget with local error/retry, never whole-page (FND-012; ERR-OPS-001; EV-010) → widget frame component with error/stale/retry states.
9. **Bulk actions report per-row outcomes** (P03 failure control; SCR-WEB-200 partial-bulk-failure state) → bulk bar + result report pattern.
10. **Blockers before submit.** Validation summary with deep links is required on SCR-IPAD-660 (ERR-SUB-001) and pre-publish on SCR-WEB-150.
11. **Every dangerous action shows impact + reason + confirmation + audit context** (Admin spec §7; UIUX acceptance checklist).
12. **Tabular numerals + high contrast for field/ops data** (retired predecessor typography; FND-011 no color-only cues, no zoom-required reading).

## 2. Engine-first build order (design must mirror it)

Shared layer precedes feature screens (G5 doc §13): ENG-03 workflow, ENG-12 audit, ENG-10 offline/sync, ENG-11 notification/SLA, RBAC guard, then design tokens/components (G6), then golden screens, then channel expansion. Fable-loop contract fixes execution order 0–11 (archive Build Contract §3): safety → source discovery → current-state discovery → contract freeze → shared foundation → **admin engines first** → runtime vertical slice → full channel scope → acceptance/negative paths → UI/UX certification → zero-regression rerun → release certification. The BRD's recommended vertical slice (§16.1) = config publish → target/visit → assignment/readiness → package/journey → check-in/execution → checklist/evidence/violation/action → submission/review → return/resubmit/compare → Factory 360/Ops → end-to-end audit/notification evidence.

## 3. Component demand profile (derived from 38 screens)

| Pattern | Screens consuming it | Contract source |
|---|---|---|
| Data table + filters + saved views + bulk bar | SCR-WEB-200, -300; SCR-ADM-010..090 lists | catalogue mandatory_regions |
| Designer canvas (tree + canvas + inspector + simulate) | SCR-ADM-031 (package), SCR-ADM-051 (workflow) | catalogue rows; Admin spec §7 |
| Map panel (official vs observed, freshness, geofence) | SCR-ADM-070; SCR-WEB-210/-400/-500; SCR-IPAD-620 | ENG-06; DEC-008 gates provider |
| Wizard/progressive sections + autosave + blockers | SCR-IPAD-630/-660; SCR-WEB-110..150 | P07/P09 |
| Evidence capture/gallery/viewer + metadata + linkage | SCR-IPAD-640; SCR-VIR-720; SCR-WEB-310 | ENG-07 |
| Version comparison / section diff | SCR-WEB-320; SCR-IPAD-670 | ENG-09 |
| Timeline / activity / audit drawer | SCR-WEB-210/-310/-400/-500 | ENG-12 |
| Queue with SLA/risk indicators | SCR-WEB-300; SCR-WEB-500 | ENG-11/ENG-04 (values DEC-gated) |
| Waiting room / verification stepper (OTP retries, escalation) | SCR-VIR-700/-710 | STM-VIR-002; ERR-VIR-001 |
| Readiness checklist (device/GPS/storage/network) | SCR-IPAD-610; SCR-VIR-700 | P04/P06B |

## 4. Decision-gated impacts (design must parameterize, never hardcode)

- **DEC-001 risk:** risk band/score components bind to configurable band set + version reference; no invented thresholds; explainability drawer required (ENG-04 "drivers, version, explanation").
- **DEC-002 GIS:** accuracy/radius displays show configured threshold + pass/fail, values from config; check-in UI includes governed override path (permission, reason, evidence).
- **DEC-003 SLA:** SLA chips/timers derive from configured calendar; design shows due/at-risk/overdue/breached semantics without inventing durations.
- **DEC-004 Arabic/RTL:** build layouts with logical properties (start/end), mirrored directional iconography, bilingual-capable typography (Inter + IBM Plex Sans Arabic per retired predecessor direction) — but ship no bilingual scope commitment until decided.
- **DEC-006 evidence:** upload components read allowed types/sizes from policy config; rejection messaging pattern fixed (ERR-EVD-002) while limits stay configurable.
- **DEC-007/008 providers:** OTP and map components sit behind provider abstractions; simulation states are visibly non-final ("simulation not release-complete", decision register).
- **DEC-009 signature:** submission flow includes acknowledgement/refusal block only; no PKI/e-signature UI implied (PKI = MVP2-011).
- **DEC-010 NFR:** skeleton/loading and pagination strategies must be re-validated once latency/concurrency targets exist; measurement hooks included.

## 5. Architecture impacts (target, greenfield)

- **Stack unfrozen.** Candidates: Next.js/React front end + Supabase (Postgres/Auth/Storage/Realtime) — G5 §3. iPad offline-first is the hard constraint: local store + outbox + idempotent replay + conflict records (STM-SYNC-001/002); plain web stack insufficient; explicit decision required.
- **Intended source layout** (only structural hint, `.claude/rules/*` path scopes): `apps/web|admin|ipad` (+virtual surface), `tests/` with requirement/acceptance IDs, `product-contract/` frozen.
- **Live environment:** Supabase `iiozvqntawxfwbgffzqu` live; schema reconciliation blocked pending secret key/PAT; connected Supabase MCP bound to unrelated production project — untouched.
- **No API contract exists.** API/event design is future G5+ work; nothing in this document invents endpoints.
- **Testing contract:** tests reference requirement + acceptance IDs; include success, negative, permission, error, offline, integration, state, regression paths; screenshot alone is not functional evidence (`.claude/rules/tests.md`).

## 6. Design exclusions confirmed (retired predecessor pack "Design exclusions" + build contract §8)

No default Material look; no Atlassian-dense treatment; no generic shadcn without retired predecessor tokens; no gradients/glassmorphism/decorative dashboards; no giant cards where tables are needed; no desktop-compressed iPad; no one-off components; no mock interactions without defined states; no fake counts/KPIs/maps/telemetry for acceptance; no hard-coded workflow/risk/checklist logic that Admin must govern.

## 7. Sequence from here (per approvals, no work started)

1. Human resolves/dispositions FABLE_OPEN_QUESTIONS.yaml items (esp. DEC-004 before G6 freeze; CONF-001/002 corrections).
2. G6 Approval 1: retired predecessor foundation (tokens, grids, RTL rules, core+enterprise components).
3. G6 Approval 2: six golden screens (Admin Package/Form Designer; Single Visit Planning; Inspector Assigned/Startup; Inspection Workspace w/ offline+evidence+validation; Level 2 Review w/ return scope + comparison; Operations Center w/ map/alerts/timeline/Factory-360 drilldown).
4. G6 Approval 3: wired end-to-end physical-journey prototype incl. mandatory failure paths (blocker, assignment conflict, outside-geofence, offline capture/sync, upload retry, duplicate-submit protection, selective return, version comparison, unauthorized, degraded).
5. Only after Approval 3 does Fable output become visual implementation authority; broad build stays blocked until G8 PASS.
