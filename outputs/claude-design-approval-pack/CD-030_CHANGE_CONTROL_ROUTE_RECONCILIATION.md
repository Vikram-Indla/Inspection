# CD-030 Change-Control Request — SCR-WEB-320 route & action reconciliation

**Status: APPROVED — sponsor ruling 2026-07-15 (V. Indla, decision owner).**
Sub-decision 1 (route): **APPROVED** — route-neutral consolidation into
`/reviews/:id`. Sub-decision 2 (accept/merge): **CONFIRMED OUT OF MVP1** — stays
`HANDOFF_BLOCKED_ACCEPT`. Graduated into
`product-contract/governance/ACTIVE_CHANGE_APPROVAL.yaml` (CC-CD030-ROUTE-001);
recorded as **DEC-013** in `decision_register.csv`; `screen_route_catalogue.csv`
SCR-WEB-320 row updated (route `/reviews/:id`, action "Navigate changed sections",
"Accept changes" deferred). Follows `product-contract/governance/CHANGE_CONTROL.md`.

The CD-030 design (SCR-WEB-320 Version Comparison) was implemented as a
**route-neutral compare mode inside `/reviews/:id`** rather than at the frozen
catalogue route `/reviews/:id/compare`, and its catalogue action **"Accept
changes"** was held as `HANDOFF_BLOCKED_ACCEPT` (no accept/merge control shipped).
Both diverge from `product-contract/screens/screen_route_catalogue.csv` and so
require a recorded change decision. The runtime slice already shipped this
session under sponsor build authorization; this CR reconciles the **contract**.

Route/screen: `/reviews/:id` · SCR-WEB-320 · P11. Files that would change on
approval: `product-contract/screens/screen_route_catalogue.csv` (SCR-WEB-320 row
only). Files already changed in the slice: `apps/web/src/app/reviews/[id]/page.tsx`,
`apps/web/src/app/reviews/[id]/VersionCompare.tsx` (new),
`apps/web/e2e/cd-030-version-comparison.spec.ts` (new).

---

## CC-CD030-ROUTE-001 — Consolidate the compare route and hold "Accept changes"

- **Change ID:** CC-CD030-ROUTE-001
- **Requestor:** Claude Code (on behalf of the CD-030 slice)
- **Business reason:** The comparison consumes the review's own immutable
  submission versions and stored returned scope. A dedicated `/reviews/:id/compare`
  route would duplicate the workspace's data load and split the reviewer's
  attention across two URLs for one decision. Consolidating it into the workspace
  keeps the diff and the decision rail on one screen. "Accept changes" implies a
  merge/mutation of an immutable submitted version, for which no proven
  action, transition, RLS policy or audit event exists.
- **Source evidence:** `screen_route_catalogue.csv` SCR-WEB-320 row
  (`/reviews/:id/compare`; actions "Accept changes; navigate changed sections");
  `WIRING_MAP_CD-030.csv` legs 11 (route reconciliation) and the
  `HANDOFF_BLOCKED_ACCEPT` legs; existing stored-answer diff in
  `reviews/[id]/page.tsx`; `reviews.returned_sections` (migration
  `0001_foundation.sql:276`).
- **Affected requirements/screens/fields/states/APIs/tests:** SCR-WEB-320;
  requirements MVP1-M06-040..048,050,053; no new field or table; no new API;
  removes the separate route; test coverage added in
  `cd-030-version-comparison.spec.ts` (legs 1/11 assert the route-neutral mode,
  legs 7/8/host assert no accept/merge control).
- **Decision required first (blocks this CR):**
  1. **Route reconciliation** — approve `/reviews/:id/compare` collapsing into a
     compare mode inside `/reviews/:id`, OR direct that the dedicated route be
     built instead. Claude did **not** self-approve this; the runtime currently
     implements the route-neutral mode.
  2. **Accept/merge decision** — confirm "Accept changes" is out of MVP1 scope
     for immutable submitted versions (recorded `HANDOFF_BLOCKED_ACCEPT`), OR
     open a decision defining a lawful merge transition, its RLS role, audit
     event and effect on version immutability. Claude may **not** invent a
     merge that mutates an immutable version.
- **MVP1/MVP2 impact:** MVP1 comparison behavior is fully delivered
  (stored-answer diff + Tamper-evident Scope Rail + explicit unavailable
  categories). Accept/merge deferral removes no accepted comparison capability;
  navigation to changed sections is preserved.
- **Regression impact:** None to CD-028 queue or CD-029 decision workspace — both
  untouched. Opening the review stays read-only. The prior inline version-diff
  block is replaced by the `VersionCompare` component with equal-or-greater truth
  (same stored-answer union-of-keys diff, now classified against stored scope).
- **Decision owner:** Vikram Indla
- **Approval:** ☑ APPROVED — sponsor 2026-07-15 (both sub-decisions); recorded as
  DEC-013 and in ACTIVE_CHANGE_APPROVAL.yaml.
- **Effective version:** SCR-WEB-320 catalogue row updated — route `/reviews/:id`
  (compare mode), action "Navigate changed sections", "Accept changes" deferred
  (HANDOFF_BLOCKED_ACCEPT) with this CR referenced. Effective 2026-07-15.

---

## Note on remaining CD-030 HANDOFF_BLOCKED legs (not part of this CR)

These stay blocked and are **not** implemented; they need their own decisions and
are recorded here so approval of the route CR is not read as clearing them:

- `HANDOFF_BLOCKED_MEDIADIFF` / `_PKGSEMANTIC` / `_METADIFF` — evidence/media,
  package-semantic and metadata/section-order comparisons are not derived in the
  runtime. Shown explicitly unavailable, never "unchanged".
- `HANDOFF_BLOCKED_LINKED` — a degraded comparison source shows affected rows
  unavailable, not an empty diff.
- `HANDOFF_BLOCKED_START_REVIEW_ATOMIC` / `HANDOFF_BLOCKED_ATOMIC` — inherited
  from CD-029; opening is read-only but the startReview and decision-write
  sequences remain non-atomic. CD-030 neither hid nor resolved them.
