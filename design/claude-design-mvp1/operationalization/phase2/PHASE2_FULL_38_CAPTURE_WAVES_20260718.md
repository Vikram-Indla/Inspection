# Phase 2 — Full 38-Screen Capture Wave Sequence

## Outcome

`PHASE2_FULL_38_CAPTURE_MATRIX_20260718.csv` is the execution inventory for the
complete governed screenshot campaign. It expands all 38 catalogue screens into
5,274 unique evidence targets across every named authorized persona, required
screen and failure state, EN/LTR and AR/RTL, light and dark themes, and governed
desktop, tablet, iPad portrait/landscape, or Operations wallboard profiles.

This is a planning artifact only. It does not capture images, approve a design,
change application code, or mutate product data or workflow state.

## Control rules

1. Audit an existing image before capturing a replacement. Reuse it only when
   screen, persona, state, locale/direction, theme, viewport, build commit, and
   freshness all match the matrix row.
2. Use read-only deterministic fixtures or existing scoped records. Never
   publish, approve, submit, cancel, reassign, check in, override, or overwrite
   a shared record merely to create visual evidence.
3. A row stops as `BLOCKED` if its state cannot be reached without a shared-data
   mutation, an unavailable provider, an unresolved route, or an unapproved
   design decision. The matrix names the safe fallback or hold.
4. Screenshots prove appearance only. They do not prove behavior, RLS/RBAC,
   audit, provider delivery, data integrity, offline replay, or immutability.
5. Binary output belongs under
   `${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/`; only the
   lightweight matrix and textual indexes remain in Git.

## Capture profiles

| Profile | Locale / direction | Theme | Viewport | Use |
|---|---|---|---|---|
| A | EN / LTR | light | 1440x1024 | Admin, web, virtual, Operations desktop |
| B | EN / LTR | dark | 1440x1024 | Admin, web, virtual, Operations desktop |
| C | AR / RTL | light | 1440x1024 | Admin, web, virtual, Operations desktop |
| D | AR / RTL | dark | 1440x1024 | Admin, web, virtual, Operations desktop |
| E | EN / LTR | light | 1024x768 | Constrained admin/web/virtual |
| F | AR / RTL | dark | 1024x768 | Constrained admin/web/virtual |
| G | EN / LTR | dark | 1920x1080 | Operations wallboard |
| H | AR / RTL | light | 1920x1080 | Operations wallboard |
| I | EN / LTR | light | 1024x1366 | iPad portrait |
| J | EN / LTR | dark | 1024x1366 | iPad portrait |
| K | AR / RTL | light | 1024x1366 | iPad portrait |
| L | AR / RTL | dark | 1024x1366 | iPad portrait |
| M | EN / LTR | light | 1366x1024 | iPad landscape |
| N | AR / RTL | dark | 1366x1024 | iPad landscape |

## Wave sequence

| Wave | Screens | Matrix rows | Execution rule | Exit |
|---|---|---:|---|---|
| W0 Preflight | all | — | Record commit/build, verify personas, fixtures and evidence root; hash and index reusable images | Safe read-only capture environment proven |
| W1 Reuse-rich | SCR-ADM-001; SCR-WEB-130; SCR-WEB-200; SCR-WEB-210; SCR-WEB-500 | 1,062 | Audit known CD004/CD023/CD026/CD027/dashboard evidence, then shoot exact deltas | Every row reused, captured, or explicitly blocked |
| W2 Reuse-partial | SCR-ADM-010/011/020/030/031/040/041; SCR-WEB-110 | 924 | Audit unregistered CD-005..011 and CD-021 frames; do not accept v1 where v2 supersedes it | Delta manifest complete |
| W3 Admin blank-slate | SCR-ADM-050/051/060/070/080/090 | 750 | Capture control-plane states; ADM-080 stops where the consolidated `/admin` surface lacks verified route truth | Six admin screens dispositioned |
| W4 Web planning/review | SCR-WEB-100/120/150/300/310/320 | 624 | Capture planning, immutable review and comparison states in journey order | Six web screens dispositioned |
| W4 Hold — as-is only | SCR-WEB-140 | 84 | Capture current `/planning/bulk/review` only; no design handoff while DSG-019 remains `correction_required` | As-is evidence indexed; hold preserved |
| W5 Field/iPad | SCR-IPAD-600..670 | 816 | Use isolated local fixtures/outbox; portrait and landscape; never transition a real visit | Eight field screens dispositioned |
| W6 Virtual | SCR-VIR-700..720 | 648 | Capture OTP truth and provider-pending/fallback states; never present staging video or DEV SMS as production-live | Three virtual screens dispositioned |
| W7 P12 command | SCR-WEB-400; SCR-WEB-500 composed states | 366 | Capture explicit unavailable/deferred boundaries; greyscale/ranked regional map only; all route movement labelled projected | Factory 360 and Operations holds visible and honest |
| W8 Audit and review | all | — | Verify filenames, hashes, row links, redaction, commit provenance, AR/RTL parity and missing-row count | `READY_FOR_DESIGN_REVIEW`; never self-approved |

## Named holds that must remain visible

- `SCR-ADM-080`: notification/SLA route requires reconciliation; capture only
  the verified logical surface already present under `/admin`.
- `SCR-WEB-140`: DSG-019 is `correction_required`; current runtime is as-is
  evidence, not an approved redesign or implementation handoff.
- `SCR-WEB-400`: SL-3, SL-4/5, SL-8, BR-010 and SL-6 remain unavailable,
  deferred, or decision-blocked; show those boundaries rather than inventing
  data or capabilities.
- `SCR-WEB-500`: SL-2 colour thresholds are unresolved; use ranked/greyscale
  regional presentation, and label inspector movement `Projected route`, not
  live GPS.
- `SCR-VIR-720`: video is provider-partial/staging-only. Evidence must say
  `Video provider pending` or carry the explicit simulation label.

## Repository-location note

The current contract says `/Users/vikramindla/Developer/Inspection` is the
canonical repository. This artifact was generated in the task's writable
checkout at `/Users/vikramindla/Documents/GitHub/Inspection` from canonical
catalogue and route inputs. Codex must reconcile/copy this unique artifact to
the canonical checkout before execution. No shared ledger was edited here.
