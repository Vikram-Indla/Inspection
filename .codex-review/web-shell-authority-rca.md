# SAQEEL Web/Admin Shell Authority RCA

Date: 2026-07-24  
Status: P0 correction required; product code unchanged by this review

## Sponsor finding

The shared Web/Admin shell, Dashboard, Operations Center and Factory 360 were
not being governed against the supplied primary structure. This was not caused
by a missing source.

The attached `saqeel web.html` is byte-for-byte the registered authority
`WA-SHELL-SRC-001`:

- size: 104,507 bytes;
- SHA-256:
  `b870e06820feb5784687dcb62289aa24a0070635cbc7b606157ec2128bab9bc2`;
- registered role: binding Phase 1 Web/Admin shell, navigation and represented
  primary-module visual/interaction authority.

The canonical requirement baseline contains exactly 478 rows, from `CR-001`
through `CR-478`. None may be silently removed, weakened or replaced.

## What failed

1. **Registered authority was treated as a reference.** Work continued from an
   earlier shell vocabulary instead of deriving the shell from
   `WA-SHELL-SRC-001` and its route manifest.
2. **Module work was reviewed without its parent invariant.** Planning and
   other page-level work received positive narratives while the shared shell
   acceptance rows remained `REGISTERED_NOT_IMPLEMENTED`.
3. **Tests certified the implementation against itself.** Some tests assert
   the drifting labels, the wrong `/field` destination and the generated
   Arabic-only wordmark instead of the approved manifest and brand assets.
4. **Historical green evidence was accepted too readily.** A passing build or
   focused test suite was treated as shell evidence even though it did not
   prove the binding information architecture, locale semantics or channel
   separation.
5. **No mandatory cross-source preflight existed.** The HTML hash, route
   manifest, preservation matrix, acceptance ledger, 478-row baseline and
   runtime DOM were not compared together before design or implementation
   consent.

## Confirmed implementation deltas

| Area | Binding authority | Current implementation | Validation |
|---|---|---|---|
| Operations / Execution | `/planning/visits?view=execution` | `/field` | Failed channel and route ownership |
| Compliance | Compliance Library; Approval Queue; Enforcement Library | Inspection Rules; Awaiting Approval; Violations & Penalties | Failed fixed labels |
| Insights | Analytics | AI Insights | Failed fixed hub |
| Administration | Six hubs in fixed order | Split, renamed and crowded first-level entries | Failed hierarchy |
| Identity | Approved bilingual wordmark asset | Generated Arabic-only text in all locales | Failed brand and language semantics |
| Top bar and responsive shell | Truthful shared controls and adaptive behavior | Substantial real functionality exists | Preserve while visually reconciling |

## Why the ChatGPT conversation did not prevent it

ChatGPT was used as a design critic, but it was not given a mandatory,
machine-verifiable preflight that forced it to reconcile the registered source
hash, exact route manifest, acceptance ledger and 478-row baseline before
advising. Its advice therefore improved local visual questions without
guaranteeing parent-shell authority. ChatGPT has now been asked for a candid
RCA, prevention controls and a corrected bounded Claude Design prompt.

## Corrective controls

1. **Authority preflight gate:** every Web/Admin module begins with the exact
   source ID/hash, route manifest, preservation matrix, acceptance status and
   applicable requirement rows.
2. **Parent-shell gate:** no child module can be accepted while F0 remains
   `REGISTERED_NOT_IMPLEMENTED`.
3. **Manifest-generated tests:** labels, order, parents, routes, channel and
   permission behavior are asserted from the approved manifest, not copied
   from current source.
4. **478-row preservation gate:** each design/build slice records retained
   dispositions and acceptance evidence for all affected requirement IDs.
5. **Channel-isolation gate:** `/field/**` may not appear as a Web/Admin shell
   destination.
6. **Brand-asset gate:** runtime asset hashes, light/dark selection and EN/AR
   behavior must match approved assets; generated text is not a substitute.
7. **Semantic scout:** every screen is checked for language, route, role,
   status, data-grain, permission and empty/degraded-state mistakes.
8. **False-green prevention:** design, frontend, wiring, QA and sponsor lanes
   stay independent and evidence-backed.

## Bounded correction order

1. Correct and sponsor-approve the shared-shell design contract.
2. Correct Dashboard, Operations Center and Factory 360 designs inside that
   shell, preserving stronger existing behavior.
3. Independently validate stable revisions and semantic deltas.
4. Record a single frontend implementation lease after sponsor consent.
5. Wire one module at a time, run authority-derived positive/negative tests and
   show the real system in Chrome before moving on.

## Ownership boundary

- Claude Design: design files, stable revisions, semantic deltas and visual
  status board.
- ChatGPT: independent challenge and corrected design prompts; no repository
  or design writes.
- Codex: repository validation, implementation lease, wiring, tests and real
  browser evidence after sponsor consent.
- Sponsor: design consent and implementation consent.

No backend, API, schema, RLS/RBAC, workflow, Field/PWA/iPad, stash, main,
deployment or product-code change is authorized by this RCA.
