# M1 Dashboard release evidence

## Scope

- Task: `TASK-WEB-ADMIN-PHASE1-M1-DASHBOARD-001`
- Batch: `WA-P1-M1-DASHBOARD-001`
- Branch: `codex/m1-dashboard-reconciliation`
- Baseline: `c8bdf6d185d0326454f8d95247cfbaab10f47ae4`
- Screens: `WA-DES-025`, `WA-DES-046`
- Routes: `/dashboard?view=strategic`, `/dashboard?view=operational`
- Requirements: `CR-001..CR-478` preserved
- Acceptance: `WA-M1-AC-001..006`
- Evidence: `WA-M1-EV-001..006`

## Outcome

Independent visual verdict: **RELEASE**.

The module is source-backed and bounded. Operations and Leadership may open it;
other personas are redirected by the server route boundary. Strategic
compliance uses only eligible answers from inspections whose latest Level-2
decision is approved. Operational values use canonical stored visit,
inspection, review, geolocation and audit records. Unresolved DEC-028 and
provider/policy dependencies remain visible as unavailable, not configured or
decision required; no substitute values are shown.

## Verification

- `npm run typecheck` — PASS.
- `npm run build` — PASS.
- Focused M1 source, functional, role-negative, RTL/responsive and
  accessibility suite — 16/16 PASS with the pre-existing Inspector setup test
  excluded.
- Final screenshot refresh after the last visual corrections — 3/3 PASS.
- Web/Admin authority validator — PASS, 478/478 requirements, 71 Phase 1
  routes, five deferred Field routes, 46 supplied/45 unique designs.
- Axe WCAG A/AA/2.1/2.2 scope — zero violations in the tested Dashboard main
  content.
- `git diff --check` — PASS.

## Final binary evidence

External approved root:

`/Users/vikramindla/Desktop/Inspection Documentation/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/web-admin-m1-dashboard`

| Evidence | SHA-256 |
|---|---|
| `analytics-blocked-en-light-1440.png` | `093b9dfb107a65cbbc1886e5c4729b74badd46c0a64630a21fe87323e49746a4` |
| `operational-ar-dark-390.png` | `f3c4b92af37400112d1034150134b359e58f64d83836cf50b01759071ee2efdf` |
| `operational-en-dark-1024.png` | `ca7617d0bb8767ce2050f277591d0d1e113138f0998160ad8aedc129892b8afa` |
| `operational-en-light-1440.png` | `d9ec9d242ab63247c4e903407d45f92eb11898985ba2aa08dccfca6e267ef9f3` |
| `strategic-ar-light-412.png` | `7a2f2755efec51bc262471c353f4ad227b92f481c494049039426ab808d925ef` |
| `strategic-en-dark-320.png` | `a74218d670e0a534f94410e8cb93f147b7ae1d0bca6a2db94ec721e526a6dcbf` |
| `strategic-en-light-1440.png` | `fd2892809582bdfa860442d3098c98113f8d69a44a0de657a04581c165e1f1c4` |

## Negative and bounded-state evidence

- Unsupported `view=analytics` remains on the requested URL and shows a neutral
  unavailable state with links to the two approved perspectives. It does not
  select Strategic or report Live.
- Missing or failed source families propagate partial status and remain
  explicit.
- Mapbox either reaches an idle rendered state before evidence capture or
  exposes the accessible provider-unavailable state.
- Planner, Reviewer, Administrator and unauthenticated access are denied.
- DEC-028-dependent KPIs remain non-live.
- No Dashboard action links to a missing in-page target.

## Recorded caveats

1. The existing Inspector authentication setup returns HTTP 400 and does not
   produce an Inspector storage state. This is external fixture debt, not a
   Dashboard authorization bypass; it remains open and is not claimed as
   passed.
2. Older Dashboard/performance specs prescribe the former planner access,
   legacy copy and an unapplied `dashboard_grouped_metrics` RPC. They are stale
   against the approved M1 contract and are not made green by restoring the
   unsafe/unapplied dependency.
3. The supplied seeding handoff contains discovery/design files but no
   executable governed dry-run. Zero remote rows were inserted, updated or
   deleted.
4. No push, merge, deploy, production mutation, remote DDL, API, Field, PWA,
   iPad or stash operation occurred.
