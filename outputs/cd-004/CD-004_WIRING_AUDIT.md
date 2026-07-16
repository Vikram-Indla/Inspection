# CD-004 Wiring Audit (DEC-012)

- Screen: SCR-ADM-001 · Route: `/admin` · Prompt: CD-004 R2 (Configuration Evidence Spine, hypothesis A).
- Implemented by: Claude Code, 2026-07-15, branch `setup/Inspection`.
- Authorization: sponsor-authorized full implementation (this session), overriding the
  manifest's `implementation_authorized: false`. BLOCKED legs below are **not** waived by
  that authorization — they require named governance/wiring decisions and stay unbuilt.
- Files changed (exact, in-scope only):
  - `apps/web/src/app/admin/page.tsx` (modify) — per-source result modelling + spine + bands.
  - `supabase/migrations/20260715090000_cd004_ar_strings.sql` (create) — Arabic `ui_strings`
    seed for `admin.overview.r2.*` (guarded, draft status). English lives inline in `page.tsx`.
- Forbidden list respected: Shell.tsx, ShellClient.tsx, shell-navigation.ts, NotificationBell.tsx,
  tokens.css, design/astryx/d2/** — all untouched; no new route; no approve/publish/edit affordance.

## Reconciliations against live truth (recorded, not silent)
1. **Landmarks (spec §1).** The design spec asks for a skip link → `<main id="overview">`. The
   frozen shell already owns the singleton `<main id="main-content">` + skip-to-content. Adding a
   second main/skip would violate the singleton-region rule. Resolution: inherit the shell's
   landmarks; no duplicate added.
2. **Headings (spec §2).** The spec asks for one `<h1>` (page title) + three `<h2>` sections. The
   frozen shell renders the page title as the sole `<h2>` (no app-wide `<h1>` exists, and the shell
   is forbidden to touch). Resolution: the three CD-004 sections are `<h3>` — a clean h2→h3 with no
   skipped levels, preserving the spec's intent (three clearly-headed sections) within the frozen shell.
3. **i18n mechanism.** The manifest's "edit `i18n.ts` key store" does not match the live code:
   English is inline `t(key, "en")`; Arabic is DB-backed (`ui_strings`). Resolution: English inline
   in `page.tsx`; Arabic via the seed migration (the CD-025 precedent).
4. **Localization gap (flagged, not invented).** Count-unit nouns (regulations/items/published/
   events/domains) have no authored Arabic in `LOCALIZATION_INVENTORY`. Authoring new Arabic is
   banned (invented Arabic scope). Resolution: counts render as LTR-isolated numbers; the noun shows
   in English only; Arabic relies on the Family column for the unit. Recommend design author these
   five nouns if the noun is wanted in Arabic.

## Wiring rows W01–W21
| ID | Leg | Disposition | Proof / status |
|---|---|---|---|
| W01 | Authenticate (middleware) | current | Frozen shell/middleware; unchanged. |
| W02 | Role resolution → scope band | current-after-modify | `user_roles` read in page; scope band from `buildShellNavigation`. Runtime: scope-band spec (pending env). |
| W03 | Direct-URL admin-family guard | **HANDOFF_BLOCKED** | Guard/policy decision required. NOT implemented; no redirect/enforcement invented. Code-layer proof: no `redirect(`, no `unauthorized.title`. |
| W04 | Spine — Compliance (regulations) | current-after-modify | Per-source model; verified/verified-zero/unavailable. Code-layer PASS. Runtime populated: spine spec (pending env). |
| W05 | Spine — Packages (package_versions + inspection_items) | current-after-modify | Two sub-sources modelled independently. Code-layer PASS. |
| W06 | Spine — Enforcement (violation_codes) | current-after-modify | Per-source model (hard unavailable case). Code-layer PASS. |
| W07 | Spine — Engines (engine_settings list + provenance) | current-after-modify | Domain list + `version_label` + `updated_at` (provenance only). Code-layer PASS. |
| W08 | Spine — Audit (audit_events) | current-after-modify | Per-source model. Code-layer PASS. |
| W09 | Page lozenge + read timestamp | current-after-modify | Header: `role=status` polite readAt + `{n} source unavailable` when failures>0; never a health verdict. |
| W10 | Per-source Retry | **HANDOFF_BLOCKED** | Handler mechanism (route refresh vs server action) undecided. NOT rendered. Code-layer proof: retry name never rendered. |
| W11 | Refresh all | deferred with W10 | No client mutation layer in this server-only slice; browser reload re-runs the reads. Not surfaced (avoids a non-functional/JS-required control). |
| W12 | Link → /admin/regulations | current | Existing route; scoped accessible name. Runtime: action-links spec. |
| W13 | Link → /admin/packages | current | Existing route. |
| W14 | Link → /admin/violations | current | Existing route. |
| W15 | Engines in-page table | current-after-modify | Domain list rendered inline (the table); no dedicated route invented (no engines action link). |
| W16 | Link → /admin/audit | current | Existing route; append-only preserved (read-only link). |
| W17 | Link → /admin/workflows | current | Link-only band. |
| W18 | Link → /admin/risk | current | Link-only band. |
| W19 | Link → /admin/gis | current | Link-only band. |
| W20 | Link → /admin/access | current | Link-only band. |
| W21 | Language/theme toggles | current (frozen shell) | Shell-owned; untouched. Runtime: Arabic RTL + dark/light specs. |
| — | Per-destination module deny vs read-only (W12–W20) | **BLOCKED** | Module guard reconciliation decision required; home only links. |
| — | Proposed provenance / draft-queue reads | **HANDOFF_BLOCKED** | Ledger 'proposed' rows. NOT read. Code-layer proof: no draft-queue/`max(created_at)` query. |

## Evidence run in this checkout
- `tsc --noEmit`: PASS (page + spec).
- `next build` (full: compile + lint + type-check + page-data): PASS — `/admin` builds as a
  dynamic route (ƒ); no env needed at build (force-dynamic defers reads to request time).
- Code-layer wiring self-check (25 assertions incl. per-source modelling, distinct states, blocked
  legs, real routes, guarded migration): 25/25 PASS.

## Evidence gated by environment (no Supabase creds / no admin persona in this checkout)
- Runtime e2e (`e2e/cd-004-admin-control-plane-home.spec.ts`): populated spine, glyph+word states,
  action links, link-only band, scope band, heading hierarchy, 44px targets, Arabic RTL,
  dark/light × 1440/1024 screenshots → run where `NEXT_PUBLIC_SUPABASE_*` env is configured.
- Per-source **failure** and **verified-zero** runtime frames: fixtures in the design pack; not
  safely forcible against live data — proven at the code layer here (as CD-025 did).
- Populated **act-scope** band: needs a seeded admin persona (only planner/inspector/reviewer exist).
- Migration application: via the repo migration pipeline (not hand-applied out-of-band).

## Verdict
Implementable scope closed and proven at the layers available here. All BLOCKED legs preserved as
BLOCKED. No accepted behavior weakened; no policy/threshold/Arabic value invented.

## Continuation verification — 2026-07-15

The configured project does contain the authoritative `admin@mim.gov.sa` persona
(documented by CD-003). The new focused runtime check in
`apps/web/e2e/cd-004-admin-control-plane-home.spec.ts` logs in with that seeded
account, verifies the populated act-scope band, and captures
`product-contract/evidence/screens/cd-004-admin-home-v1/scope-admin-en-light.png`.
That focused run completed **4/4 PASS** including the three auth setup cases.
CD004-EV-005 is therefore captured. The per-source failure/verified-zero frames
remain intentionally blocked because forcing those backend states would require
an authoritative fixture/data disposition; the code-layer proof remains valid.

The current authoritative `outputs/cd-004/WIRING_MAP_CD-004_R2.csv` was also
validated as a rectangular CSV (**21 rows × 20 columns**). Two rows with omitted
blocker cells were repaired with explicit empty fields; archived received-design
copies remain preserved as historical artifacts.
