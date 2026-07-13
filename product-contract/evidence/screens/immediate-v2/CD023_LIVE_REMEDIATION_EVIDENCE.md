# CD-023 Live Remediation Evidence

- date: 2026-07-14
- project: Supabase `iiozvqntawxfwbgffzqu`
- scope: MVP1-M01-043..052, MVP1-M02-012, FND-001/003/007/011
- runtime verdict: **FOCUSED LIVE PASS / INDEPENDENT DEC-012 VERDICT PENDING**

## Database

Migrations 0027-0031 were applied transactionally through the authenticated
Supabase dashboard. Inventory and behavior checks confirmed the private helper
schema, exact grants, RLS auth initplans, expiry exclusion for Inspector-created
start-now Visits, and the canonical assignment overlap trigger. The live project
does not expose a Supabase CLI migration-history table; no ledger was invented.

The final concurrency test sent two different Planner requests for different
factories, the same Inspector, and the same window. Exactly one request returned
`ok`, the other returned a governed blocker, and exactly one Visit remained.

## Application and runtime

- `npm run build`: PASS
- `npm run typecheck`: PASS
- focused live spec: 12/12 PASS
- persona regression: 9/9 PASS
- isolated SQL contract: `CD023_DATABASE_CONTRACT_PASS`
- visual evidence: 8 PNGs in this directory

The focused suite proves blank-coordinate rejection, minimum temporary identity,
Visit-level location provenance, immutable official coordinates, complete audit
legs, package and duplicate blockers, request idempotency, stored-role replay,
identity-key serialization, Inspector-window serialization, Inspector self-start
without assignment notification, Arabic/RTL authority content, theme persistence,
and horizontal-overflow safety.

## Evidence frames

- `en-dark-desktop.png`
- `en-dark-narrow.png`
- `en-light-desktop.png`
- `en-light-narrow.png`
- `ar-dark-desktop.png`
- `ar-dark-narrow.png`
- `ar-light-desktop.png`
- `ar-light-narrow.png`

## Remaining gate

The implementation session cannot independently certify itself. A different
Codex reviewer must compare this live evidence and runtime against every row in
`outputs/cd-023/WIRING_MAP_CD-023.csv`, record the DEC-012 verdict, and hand the
result to the sponsor for runtime acceptance. The earlier static re-audit is
supporting evidence, not the final post-live verdict.
