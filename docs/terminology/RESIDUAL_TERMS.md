# Residual Terms

What remains, and why, as of implementation branch `3b7c057` (Wave 4 HEAD).

## Fixed during Wave 5 residual review (not left as gaps)

| Term | File | Fix |
|---|---|---|
| "factory registry" | `apps/web/src/app/factories/page.tsx:61` | → "Factory list" — 3rd call site of `f360.err.neutral`, missed by Wave 1 |
| "No factories in the registry" | `apps/web/src/app/factories/page.tsx` | → "No factories in the list" |
| "Clear the filter to see the full registry." | `apps/web/src/app/factories/page.tsx:45` | → "...full Factory list." |
| "Factory registry unavailable" | `apps/web/src/lib/ai/contextual-actions.ts:33` | → "Factory list unavailable" |
| "contract-unverified (fail-closed)" | `apps/web/src/app/field/factory-360/[id]/page.tsx:269` | → "not shown until it can be confirmed" |
| "RLS-scoped" (×12) | portal, visits/calendar, visits/map, visits list (×2), admin/access, admin/compliance-requests (×3), admin/compliance-approvals (×2), dashboard/loading | → "filtered to your access" (contextual per line) |
| "factory master" / "registry sync" | `apps/web/src/app/factories/[id]/page.tsx` (a Factory 360 destination page no wave named explicitly, despite being heavily linked from visits/planning/operations) | → "Factory list" / "Factory list synced" / "Factory list sync" |
| Stale e2e assertion | `apps/web/e2e/factory360-admin-control-plane.spec.ts:39` | Updated to match Wave 1's already-shipped "Factory 360 profiles are read-only" |

## Deliberately left unchanged — internal architecture

Per the governing task's explicit instruction not to rename internal
symbols merely to hit zero internal-text matches:

- `loadFactory360Dossier`, `Factory360Dossier`, `dossier.ts`,
  `canonical-projection.ts` (all internal variable/function/file names in
  `apps/web/src/lib/factory360/`)
- `dossierStrings`, `dossier_href`, CSS classes `lg-atlas3d__dossier*`,
  `ar-dossier`
- `SaudiAtlasDossier`, `DossierStrings`, `IdentityDossier` — unrelated
  internal component/type names (a decorative login-page map feature and a
  planning-wizard candidate-preview component; neither is the Factory 360
  concept, both happened to use "dossier" in their internal naming before
  this project and were never user-visible)
- `FEATURE_DECISION_DOSSIER` — protected env var name (committee feature
  flag). Surfaces in two places, both reviewed and accepted: (1) inside an
  expandable "Why / prerequisites" disclosure (`seam=` prop on
  `NotYetBoundary`), which the task's own Section 7 explicitly allows
  ("preserving the technical code in ... an expandable support detail");
  (2) a server-action error message following the same
  parenthetical-technical-code pattern already established elsewhere in
  the app (`DEF-WF-006`, `M04-164`) and left untouched by every prior wave.
- `TemplateRegistry` component name, "Governed template registry" heading
  (`admin/packages/page.tsx`) — different domain (package/checklist
  templates, not the factory registry)
- "Governed endpoint registry" (`admin/integrations/page.tsx`) — different
  domain (integration endpoints, not the factory registry)
- `audit_event_registry` — DB table name

## Deliberately left unchanged — systemic conventions, not this project's scope

- **Traceability ID badges** (`SCR-WEB-*`, `SCR-ADM-*`, `M0x-*`, `ENG-*`,
  `RBAC-*`, `FND-*`, `DEC-*`, `CMP-REQ-*`) rendered in Shell "context"
  lozenges next to page titles/headings across nearly every admin page,
  including pages already remediated in Waves 1-3 (e.g.
  `admin/packages/page.tsx` still shows `SCR-ADM-030/031 · ENG-02`
  unchanged). This is a consistent, intentional cross-admin convention —
  CLAUDE.md requires "Keep IDs in code, tests, evidence, and handoffs."
  Stripping these platform-wide would be a large, separate change-control
  decision, not a per-wave terminology tweak, and doing it piecemeal would
  create visual inconsistency between remediated and un-remediated pages.
  **Recommendation**: a dedicated follow-up task, scoped and approved
  separately, if the product owner decides these should not be end-user
  visible at all.
- Parenthetical requirement/engine codes inside otherwise-plain-language
  sentences (e.g. "bypasses Visit Plans (M01-050)", "bind every requirement
  ... (M06-002)") — same reasoning; a systemic pattern, not ad hoc jargon
  leakage, and changing it selectively would be inconsistent.

## Flagged, not resolved — needs a product/legal decision

- **"immutable" cluster beyond what Waves 2/4 covered.** The two
  dedicated passes (Wave 2's "Submission & Immutable Cluster" worker, plus
  Wave 5's residual grep) covered every genuinely user-visible occurrence
  found by directory-scoped and repo-wide search respectively. No further
  known instances remain, but this was the single largest glossary term by
  volume (~50+ strings across 2 passes) and is the term most likely to
  reappear if new inspection-submission UI is added later — the
  terminology regression test does **not** currently guard against new
  "immutable" strings (only the explicitly banned-phrase list), since
  "immutable" legitimately describes real system behavior and blanket-
  banning the word would produce false positives on future legitimate
  uses. Recommend human spot-check on any new submission/version UI.
- **Dev-jargon in Planning context lozenges.** The Planning wave's worker
  explicitly declined to sweep `SCR-WEB-110 · AND/OR criteria builder`-
  style badges (see `CHANGE_MAP.md` Wave 2 notes) since it wasn't in that
  wave's explicit focus list and a partial sweep risked inconsistency —
  same systemic-convention reasoning as above.
- **Full browser/visual acceptance** (Section 11 of the governing task).
  See `VALIDATION_REPORT.md` — not performed, no live dev server available
  in this worktree.
