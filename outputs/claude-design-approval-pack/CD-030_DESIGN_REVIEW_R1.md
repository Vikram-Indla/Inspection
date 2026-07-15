# CD-030 Design Review — R1

**Verdict: NOT READY FOR SPONSOR DESIGN REVIEW.** The three comparison hypotheses are genuinely distinct and the design correctly avoids a fake media/package diff. Four P1 issues block acceptance.

## What passed

- Scope-rail-first, side-by-side-first and chronological-first are visibly different, equal-fidelity directions.
- The selected direction rejects a code-diff aesthetic and states that semantic, evidence, package and section-order differences are unavailable when not derived.
- The package includes `support.js`, retains the execution prohibition, and correctly describes `/reviews/:id` as a route-neutral comparison mode.

## P1 corrections required

1. **The archive preflight is false.** `Plan Review and Publish (5).zip` contains 334 files, including CD-025–029 packages, root-level duplicates, `screens/` and `uploads/`. Its `PACKAGE_PREFLIGHT_CD-030.md` says the archive contains only `outputs/cd-030-r1/`. Deliver a newly built archive containing only `outputs/cd-030-r2/`; do not simply put an R2 folder into a mixed archive.
2. **The Tamper-evident Scope Rail overclaims runtime truth.** Current code reads `reviews.returned_sections` as section keys and computes changed answer keys from `snapshot.answers`. It reads package `definition.sections`, but no verified mapping proves that a changed answer belongs to a returned section. Rows 5–6 in `WIRING_MAP_CD-030.csv` therefore cannot be `PASS`. Mark scope classification and unexpected locked change `HANDOFF_BLOCKED_SCOPE_MAPPING` until exact section-item-to-answer-key mapping is proven. Design the blocked/mixed/unmappable state; never label a change expected or tampered solely from the current data.
3. **Required evidence is claimed but absent.** The state matrix lists S04 empty diff, S06 unavailable package semantics, S07 degraded source, S08 stale, S09 unauthorized and S11 loading, yet no corresponding PNGs are delivered. Supply populated frames for every state row and list each exact filename in the inventory/preflight.
4. **Preflight evidence is not actual evidence.** It asserts A/B/C have distinct hashes without recording the hashes, and it does not report the archive listing or state-frame inventory. Record the actual SHA-256 values, the single archive root, each local-reference result and every state-to-PNG path. Return `PACKAGE_PREFLIGHT_PASS` only if those facts are true.

## P2 correction

- In the rendered HYP-A frame, metadata collapses into unreadable strings such as `Fromv2submitted` and `PKG-STEEL-PERIODIC v4` without clear separation. Correct spacing, hierarchy and focusable target boundaries in all directions, including RTL and 412px.

## Do not regress

- Keep the three hypotheses, route-neutral mode, immutable stored-answer diff, unavailable semantic/media/package treatment, non-colour diff, Arabic/RTL, reduced-motion list equivalent, and no accept/merge action.
- Preserve `HANDOFF_BLOCKED_START_REVIEW_ATOMIC` and `HANDOFF_BLOCKED_ATOMIC` as contextual truths; CD-030 must not resolve CD-029 workflow atomicity.
