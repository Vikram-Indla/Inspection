# Independent Claude Design Mapping Review

Date: 2026-07-24  
Overall reviewer recommendation: **RETURN FOR MAPPING CORRECTION**  
Pilot reviewer recommendation: **APPROVE DESIGN-ONLY PILOT RECORD WITH EVIDENCE CAVEAT**

## Outcome

Claude Code corrected the inventory to 98 pages, content-read the disputed Admin and Control Panel pages, separated code-candidate confidence from design-content verification, corrected the Executive Overview and Admin Detail component evidence, and retained the agreed design-only ownership boundary.

The mapping is now internally usable as a candidate register, but it is not yet an implementation authority. Of 53 relevant Web/Admin design rows:

| Codex validation | Count |
|---|---:|
| CONFIRMED | 3 |
| CONFIRMED WITH CORRECTION | 2 |
| INSUFFICIENT EVIDENCE | 35 |
| NO CODE MATCH | 10 |
| AMBIGUOUS | 3 |

The independent repository scan still finds 74 current Web/Admin `page.tsx` routes: 32 Admin and 42 Web/shared. Field, PWA, and iPad routes are outside this review.

## Confirmed mappings

- **SAQEEL Item Execution** → `/admin/items` and `/admin/items/:id/runtime-preview`.
- **SAQEEL Report Package Foundation** → `/admin/packages`.
- **SAQEEL Profile** → `/profile`; the sponsor-approved design-only RTL isolation correction is recorded at accepted revision `1784896277489148`.
- **SAQEEL Establishment Violations** → `/admin/bulk-violations`, with a required correction to the stale route comment embedded in the design.
- **SAQEEL Executive Overview** → `/dashboard?view=strategic` and `DashboardView.tsx`/`StrategicView`; the design's Gemini/AI composer is not represented by code, which intentionally exposes deterministic non-AI filters.

## Incorrect and ambiguous mappings

- **SAQEEL Admin / SAQEEL Control Panel — AMBIGUOUS:** both content-read designs plausibly target `/admin`. The inherited Control Panel → `/admin/operations` mapping is incorrect because that route is a narrow operations-resilience page. Sponsor/design authority must choose a canonical `/admin` design or define distinct views/routes.
- **SAQEEL Admin Lookups — AMBIGUOUS:** `/admin/localization` and `/admin/planning/lookups` are both real; the design was not content-compared.
- **SAQEEL Admin Form Builder — NO CODE MATCH:** neither `/admin/templates` nor `/admin/packages/:id/designer` exists.
- **SAQEEL Delegation — NO CODE MATCH.**
- **SAQEEL Report Deltas — NO CODE MATCH.**
- **SAQEEL Report Inventory and SAQEEL Web-Index — DESIGN ONLY:** reference artifacts, not application screens.
- **SAQEEL Executive Overview — CONFIRMED WITH CORRECTION:** do not implement the depicted AI behavior without a separate approved AI/provider/backend contract; align the design to the approved fail-closed code behavior.
- **SAQEEL Admin Detail — INSUFFICIENT EVIDENCE:** six route/component files exist, but the design was not content-read. Claude's corrected mapping says six files/medium while `reports/unmapped-designs.md` still contains a stale “5 files/high” sentence.

## Remaining missing evidence

- Content reads and nearest-match comparisons for 35 route-candidate rows.
- Semantic delta and design-versus-code behavior comparison for those 35 rows.
- Route-to-service/API traces before any WIRE classification.
- Design-content disambiguation for Admin Lookups.
- Sponsor/design-authority decision for Admin versus Control Panel.
- Corrected stale Admin Detail sentence in Claude's `reports/unmapped-designs.md`.
- Stable semantic hashes or immutable snapshots. Claude currently records etags and explicitly leaves semantic hashes null.
- Route-specific runtime tests, negative paths, and evidence IDs for any future implementation lease.

## Recommended sponsor decision

Do not issue a general Web/Admin implementation lease.

1. **RETURN FOR MAPPING CORRECTION** for the 35 unverified route candidates and the three ambiguous rows.
2. **CHANGE DESIGN** for Executive Overview unless a separately approved AI capability contract is produced.
3. **CORRECT** the Establishment Violations route comment and the stale Admin Detail report sentence.
4. Accept the Profile design-only pilot record with the evidence caveat documented in `pilot-delta-review.md`.
5. Keep all no-code and design-only rows **BLOCKED** from implementation.

## Proposed implementation ownership boundary

- Claude Code exclusively owns Claude Design connection, inventory, identity/revision records, content reads, semantic deltas, change tracking, mapping correction, consent packets, and sponsor-approved design edits.
- Codex owns independent repository, route, component, service, API, wiring, test, and regression validation.
- After a separate sponsor decision names the exact action and files, Codex may receive a bounded application wiring lease. Claude remains the design owner and reviewer for design fidelity.
- No file may have joint CLI ownership. Any overlap stops until the sponsor records reassignment.
- Current state: **no application implementation lease**.

No product code, APIs, PWA/iPad surfaces, stashes, `main`, or `setup/Inspection` were modified.
