# CD-025 Design Review R3 — P0/P1 Only

- Review date: 2026-07-14
- Submission: `/Users/vikramindla/Downloads/Plan Review and Publish (1).zip`
- Task: `TASK-DESIGN-CD025-REVIEW-R3`
- Process/screen: `P03 / SCR-WEB-150`
- Runtime baseline verified by Codex: `9360fc9`
- Design scope: review only; implementation is not authorized
- P0 findings: none
- Sponsor recommendation: **BLOCK THE SUBMITTED R3 ARCHIVE; PRESERVE THE R3 DESIGN AND RUN ONE SYNCHRONIZATION CORRECTION**

## Executive decision

The root R3 design is materially corrected. `CD-025 Plan Review and Publish.dc.html` now presents the role-scoped grouped Planner shell, navigation search, collapse control, account ownership, responsive drawer and a focusable-element-based keyboard trap. The page-specific blocker-first workspace, Publish Consequence Ledger, 12→10 scope truth, atomic publication model and 28-state set should be preserved.

The submitted archive is nevertheless not an R3 package. It is a hybrid containing an updated root design and three R3 mapping files alongside an obsolete R2 standalone export, R2 screenshots, R2 state matrix, R2 acceptance checklist, R2 provenance and an unsafe R2 Claude Code handoff. The R3 manifest points to a standalone file that is not present. Therefore the package is internally contradictory and cannot be sponsor-approved or sent to Claude Code.

This requires one focused R4 synchronization pass, not another visual redesign.

## P1 findings

### P1-01 — The archive is an internally contradictory R2/R3 hybrid

Only these files exist under `outputs/cd-025-r3/`:

- `IMPLEMENTATION_MANIFEST_CD-025.yaml`
- `COMPONENT_MAP_CD-025.csv`
- `WIRING_MAP_CD-025.csv`

Every other governed handoff asset remains under `outputs/cd-025-r2/`. Those R2 files still claim the obsolete `setup/Inspection` baseline, absent atomic publishers, round-robin assignment, absent Validated persistence, a flat shell and the defective custom `NarrowAppBar`.

This fails the explicit requirement that every frame, annotation, mapping, checklist, provenance record and Claude Code handoff describe the same R3 truth.

### P1-02 — The delivered Claude Code prompt is stale and unsafe

The only implementation prompt is `outputs/cd-025-r2/CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-025.md`. It identifies the design as R2, names `NarrowAppBar`, says the design was grounded at `setup/Inspection`, and treats the guarded atomic publishers and Validated lifecycle as potentially absent.

That prompt must not be pasted into Claude Code. It could direct an implementer to recreate or weaken protected runtime behavior and rebuild shell behavior already owned by `ShellClient`.

### P1-03 — Required R3 standalone and visual evidence are missing

The R3 manifest names:

`outputs/cd-025-r3/CD-025 Plan Review and Publish.standalone.html`

That file does not exist. The supplied standalone is the R2 export and visibly contains the old flat navigation, obsolete narrow app bar, `cd-drawerfirst` on Planning and `cd-drawerlast` on Sign out.

The named PNG exports are also under R2 and show the obsolete shell. The loose `screens/01-drawer.png`, `02-drawer.png` and `narrow.png` likewise show the old flat drawer, not the grouped Planner shell. Consequently the corrected desktop, Arabic RTL and drawer keyboard behavior has no synchronized visual evidence.

### P1-04 — The mandatory baseline stop condition was not followed

The correction prompt required Claude Design to stop with `BASELINE_UNAVAILABLE — CD-025 R3 NOT GENERATED` if it could not access exact `main @ 9360fc9`.

The R3 manifest and annotations instead say that the exact SHA was not resolvable but that another `main` state appeared to match. The mapped runtime claims happen to align with Codex's verified repository, but the required provenance condition was not met and must not be described as exact verification.

R4 must either inspect `9360fc9` exactly or mark the baseline as requiring independent re-verification. It must not claim exact source verification that did not occur.

## Deliverable matrix

| Deliverable/state family | Result | Review |
|---|---|---|
| Root `.dc.html` R3 composition | Pass | Grouped Planner shell and existing CD-025 workspace are present. Preserve. |
| Root drawer focus model | Pass by static review | Uses all enabled visible focusables, traps forward/reverse Tab, closes on Escape and returns focus to trigger. Runtime evidence still required. |
| 28 page-content states | Pass provisionally | Accepted R2 content model remains and the runtime truth copy is corrected in `cd25-stage.js`. Preserve all states. |
| R3 manifest | Correct | Core runtime mapping is largely corrected, but it references missing files and overstates baseline verification. |
| R3 component map | Pass | Protected shell and atomic publisher ownership are mapped correctly. |
| R3 wiring map | Pass | Atomic bulk/single publication, rollback and queued notifications are correctly mapped. |
| R3 standalone export | Block | Missing. The only standalone is stale R2. |
| R3 state matrix | Block | Missing. The only matrix is stale R2 and still records round-robin runtime notes. |
| R3 acceptance checklist | Block | Missing. The only checklist certifies the obsolete flat shell and `setup/Inspection`. |
| R3 research/runtime provenance | Block | Missing. The only provenance is stale R2. |
| R3 Claude Code handoff | Block | Missing. The only handoff is unsafe R2. |
| R3 Claude Code implementation prompt | Block | Missing. The only implementation prompt is unsafe R2. |
| Desktop dark/light evidence | Block | R2 PNGs show the obsolete shell. |
| Arabic RTL evidence | Block | R2 PNGs do not prove the corrected grouped shell/account behavior. |
| 412px closed/open drawer evidence | Block | Loose screenshots show the obsolete flat drawer and are not synchronized R3 evidence. |
| Package synchronization | Block | Mixed revisions, contradictory baseline/runtime statements and missing target files. |

## Protected behaviors and regression risks

Preserve without reinterpretation:

- guarded atomic `publish_bulk_plan` and `publish_single_visit`;
- caller RLS and authoritative role, target, package, visit-type, duplicate and assignment rechecks;
- factory advisory locks and assignment-overlap serialization;
- first eligible available Inspector selected server-side at publish;
- `Draft → Validated → Published` persistence;
- complete rollback with no partial or optimistic success;
- append-only audit mutation records;
- queued-not-delivered notification truth;
- direct Planner publication;
- neutral failures with no raw provider/database errors;
- read-only `/planning/plans/:id`;
- exact shared shell ownership in `Shell.tsx`, `ShellClient.tsx` and `shell-navigation.ts`;
- final route/lifecycle/CD-024→CD-025 handoff remaining `HANDOFF_BLOCKED`.

The highest regression risk remains the stale R2 Claude Code prompt. Do not execute any implementation prompt from this archive.

## Arabic, RTL, theme, responsive, accessibility and security findings

- **Arabic/RTL:** The root R3 design retains Arabic strings and physical `dir="rtl"`. Pass provisionally; corrected shell screenshots and interactive evidence are missing.
- **Themes:** Root design retains dark/light switches. Pass provisionally; the named evidence still renders R2.
- **Responsive:** Root R3 design now uses the shared shell model. The supplied screenshots are obsolete and cannot evidence it.
- **Keyboard:** Static root logic corrects the earlier skipped-Overview defect by discovering actual focusables. R4 must prove first focus, reverse wrap, forward wrap, Escape and focus return in English and Arabic.
- **Screen reader:** Existing page alerts/status semantics are preserved. R4 must synchronize the state matrix and checklist with those semantics.
- **Security/runtime:** The R3 mapping files correctly preserve atomic publishers, RLS and queued-not-delivered truth. The stale R2 handoff contradicts them and makes the archive unsafe as a whole.

## Sponsor recommendation

**Block this archive.** Do not restart CD-025 and do not discard the root R3 design. Run the focused R4 synchronization prompt, then perform one final Codex review of the regenerated archive. Only a single-revision package with the corrected standalone, evidence, matrices and sponsor-gated Claude Code prompt can be considered for approval.

## P2 register for the final consolidated Big Bang critique

- Test whether the persistent consequence rail is too dense between 1024px and 1280px.
- Test whether `staged / not yet persisted` creates avoidable loss anxiety.
- Validate long Arabic factory names, account identities and role labels with production-length localization data.
- Consider reducing repeated explanatory prose after comprehension testing, without removing publication consequence truth.
