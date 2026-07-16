# CD-043 R2 — Required Correction Prompt

Correct **CD-043 / SCR-VIR-720 / P06B — Provider-Neutral Virtual Inspection Session**. R1 is blocked. Do not patch its preflight or reuse its fit-scaled screenshots. Rebuild the package from actual repository truth and export reviewable visual evidence.

## Correct these release-gate failures

1. **Read the real sources.** Open every source named in the CD-043 R1 prompt. `source-receipt.md` must identify the exact function, route, state, data read/write, RLS/guard, audit event, and error/result semantics used by each design claim. Do not call all runtime behavior `DERIVED_NOT_PROVEN` merely because the design environment did not read the repository.

2. **Use the proven session boundary.** `beginRemote` only permits `verified`/`in_progress`, creates/reuses the inspection against its frozen package, appends the begin event, and redirects to `/field/inspection/:id`. `closeSession` requires a reason and makes the session immutable. The provider-pending room has no live provider. Preserve these facts precisely.

3. **No fake provider action.** Remove “Retry provider,” “lost provider connection,” rejoin, media recovery, and any other clickable/operational provider control unless an approved adapter supplies the action, state, result, audit, and error contract. A provider-absent state can be informative and may offer only proven navigation/session actions.

4. **No invented event or workflow.** Do not claim an “opened on shared engine” timeline event unless it exists. Do not say physical follow-up is recorded against a visit unless the exact canonical workflow, write, audit event, and authority are established. Use `HANDOFF_BLOCKED_PHYSICAL_FOLLOW_UP_SEAM` otherwise.

5. **Separate close truth from desired improvement.** Current close behavior does not provide a clean verified “state changed + notification degraded” response contract. Present the desired distinction as an implementation hand-off, not a delivered live behavior, until the action/API/UI contract is changed and verified.

6. **Do not render static P07 checklist/evidence as a live virtual-room read.** The runtime redirects to the common field engine. Either keep CD-043 as the proven session boundary plus deep-link, or specify and prove the exact summary read/RLS/loading/error seam for an embedded continuity preview.

## Visual evidence requirements

- Create 20 individual, legible low-fidelity architecture thumbnails. They must show materially different structural treatments of the session boundary, common-engine hand-off, provider boundary, evidence adequacy, and close consequence—not coloured placeholder bars.
- Render three genuinely distinct, equal-fidelity **native 1440 px** candidates. Select one using stated criteria.
- Export full native, lossless screenshots at exact widths: 1440 desktop dark EN/LTR; 1440 desktop light EN/LTR; 1024 tablet; 412 narrow; Arabic/RTL at desktop or narrow; each unselected candidate at 1440.
- For every required state, capture after selecting that state. The state’s identifying content, current status, enabled/disabled action, truthful recovery, audit/provenance effect, and shared-engine effect must all be visible in the image.
- Do not use 909 px fit-scaled harness exports. Do not crop below the state content. Add a capture manifest that records the selected state, viewport, image dimensions, and file hash.

## State and scope rules

Keep the inspector-operated model and CD-042 server gate. The provider-pending state must remain useful without pretending media works. Include provider-adapter and remote-evidence concepts only as explicitly blocked contracts. Include loading, empty, validation, unauthorised, closed/read-only, stale, degraded, offline, provider unavailable/absent, insufficient evidence, quarantine, no-gate, no participants, and route reconciliation—but use only recovery actions that current runtime or a clearly declared hand-off supports.

## Final archive gate

Submit a new ZIP whose root contains **only** `outputs/cd-043-r2/`. No previous CD packages, root sources, screenshots, nested ZIPs, or unrelated assets.

`PACKAGE_PREFLIGHT.md` may say PASS only after measuring the final ZIP: one root, no contamination, 20 meaningful individual thumbnails, three native 1440 candidates, native final dimensions, all state frames visibly correct, accessible/RTL evidence, and no unsupported provider/evidence/follow-up/notification capability presented as live.

Do not start frontend implementation. Return only the corrected CD-043 R2 design evidence package and its truthful final preflight.
