# CD-029 Design Review — R2

**Verdict: NOT READY FOR SPONSOR DESIGN REVIEW.** The design direction is promising and the three hypotheses are visibly distinct, but the delivered package fails its own consolidation/preflight contract.

## What passed

- HYP-A, HYP-B and HYP-C are three genuinely distinct full compositions.
- The Finding Trace Chain, immutable submission framing, decision rail, partial-decision state and media-degraded state are present.
- The package preserves `implementation_authorized: false` and the Claude Code execution prohibition.

## P1 corrections required

1. **Runtime truth is stale.** R1 presents opening `/reviews/:id` as a page-load mutation and uses `HANDOFF_BLOCKED_PAGELOAD_MUTATION`. The current route is read-only on open: `StartReview.tsx` explicitly invokes `startReview`; `page.tsx` offers it only for a submitted inspection with no open review. Replace every page-load-mutation claim, state and wiring row with the explicit start-review action. That action remains non-atomic: review insert succeeds before inspection status transition, so surface `HANDOFF_BLOCKED_START_REVIEW_ATOMIC` and do not invent rollback or ownership certainty.
2. **The package is not self-contained.** Both design HTML files reference `./support.js`, yet `outputs/cd-029-r1/` contains no `support.js`. Add it to the corrected package and inventory, then verify both HTML files open with no missing local asset.
3. **The submitted archive is contaminated.** It contains 301 files, including CD-025–028 packages, root-level duplicate assets, `screens/`, and `uploads/`. Deliver a newly built archive whose only top-level content is `outputs/cd-029-r2/`.
4. **The required preflight is missing.** No `PACKAGE_PREFLIGHT_CD-029.md` is delivered. Add it with actual pass/fail checks, paths, archive-root proof, local-reference check, A/B/C hashes, state-frame inventory and the exact final `PACKAGE_PREFLIGHT_PASS` marker. Do not declare PASS if any check is absent.
5. **State/evidence claims exceed the evidence delivered.** The state matrix claims S05 reject-without-reason, S07 stale, S08 unauthorized, S09 missing evidence, S11 multi-critical and S13 loading, but no corresponding PNGs are in the package. Produce populated evidence for each. Also provide the promised Arabic/light, desktop/1024/412 coverage rather than only a partial mix.
6. **Navigation readability fails in the rendered hypothesis evidence.** The section strip visibly collapses into text such as `Checklist6Finding trace3…`. Correct spacing, boundaries, counts and target size so each section is recognisable and keyboard-focusable as its own control.

## Do not regress

- Preserve all three hypotheses and their equal-fidelity comparison.
- Preserve immutable submitted versions, exact return scope + reason, reject reason, decided lock, append-only audit, source-vs-observed verification, unavailable media and queued-not-delivered language.
- The decision chain remains `HANDOFF_BLOCKED_ATOMIC` until transactional proof exists.
- Do not redesign CD-028 or implement application code.
