# iPad Inspector — Phase 2/3 Resume Note

> **Start-here note for resuming work.** Phase 2/3 (Inspection Workspace + Offline-first) is **complete and shipped** on `setup/Inspection`. This note is where to pick up next.

_Session: 2026-07-26. Author: Claude (subagent-driven TDD execution of Tasks 5-11)._

Related:
- Progress overview: [[apps/ipad/IPAD_APP_PROGRESS]]
- Plan executed: [[docs/superpowers/plans/2026-07-26-ipad-inspector-phase2-3-workspace-offline]]
- Design spec: [[docs/superpowers/specs/2026-07-25-ipad-inspector-native-design]]
- Phase 1 follow-ups: [[apps/ipad/PHASE1-FOLLOWUPS]]
- How to run: [[apps/ipad/README]]

---

## ✅ What got done this session (Tasks 5-11)

The full **Inspection Workspace + Offline-first** slice. Built via subagent-driven TDD: per-task implement → review → fix-loop, then a final whole-slice review.

| Task | Delivered |
|---|---|
| 5 | Workspace domain models + DTOs (schema-verbatim) |
| 6 | `WorkspaceRepository` + `SupabaseSyncGateway` |
| 7 | `@MainActor WorkspaceStore` — answer autosave → GRDB draft + outbox → sync |
| 8 | Checklist UI — `WorkspaceView` / `ChecklistItemView` (segmented / text / date controls) |
| 9 | Photo evidence capture (CryptoKit sha → outbox → Storage) |
| 10 | PencilKit signature + submission snapshot (keyed by item **code**, `submitted_offline`) |
| 11 | Visits → Workspace navigation (`@StateObject`-owned `WorkspaceScreen`, not-started placeholder, header sync badge) |

- **102/102 tests pass**; app **builds + boots** on iPad mini (A17 Pro) sim, no crash.
- Commit span: **`eef6006..22a7989`** (13 commits) on `setup/Inspection`.
- Tasks 1-4 (GRDB `OfflineStore`, `OutboxOp`, `SyncEngine`) were already done in a prior session (`d3ee90c..fe03584`).
- Full SDD ledger (every task, review, fix round, ruling): `.superpowers/sdd/2026-07-26-ipad-inspector-phase2-3-workspace-offline/progress.md`.

### Final review caught 2 runtime-critical schema bugs — both fixed (`3fd92ab`)
- `item_rules` real shape is object values, not strings → `PackageDefinition.itemRules` fixed to `[String:JSONValue]?` (was breaking **every** workspace load).
- evidence upsert used phantom `sha256` + omitted NOT-NULL `inspection_id` → fixed to `content_sha256` + `inspection_id` (was breaking **every** evidence sync).

---

## ▶️ Pick up here next time

### 1. Manual E2E (human-only — needs real login)
Cannot be automated headlessly. Needs gitignored `apps/ipad/InspectionApp/Config/Secrets.local.xcconfig` with real Supabase creds. Steps:
1. Build + run on the simulator; sign in as `inspector@mim.gov.sa`.
2. Open an **in-progress** visit → workspace should resolve and load the checklist.
3. Answer items (autosave), attach a photo, sign, submit.
4. Confirm the **sync badge** transitions and the submission reaches Supabase (`submission_versions`, `evidence`, `checklist_responses`).

### 2. Parked follow-up (small, real but latent)
`SupabaseSyncGateway.uploadEvidence` sets `inspection_id = op.inspectionId ?? op.visitId`. A visit UUID is **not** a valid `inspections.id` FK. Unreachable in the current flow (`attachPhoto` always passes a non-nil inspectionId), but the guard should require `inspectionId` specifically instead of falling back to `visitId`. One-line hardening.

### 3. Documented deferrals inside this slice (safe, revisit when their phase lands)
- `versionNumber` hardcoded `1` (no submission-count field yet; resubmission gating is out of scope).
- `isOnline` hardcoded `{ true }` — wire **NWPathMonitor** (was scoped as a Task 9 note).
- Visits ordered/paginated query still blocked by backend RLS perf on `has_planning_capability` (Phase 1 limitation — **backend fix**: mark function `STABLE`/optimise RLS/add index).
- Offline fallback builds sections with empty items (full item hydration needs a network fetch).
- `answer()` / `submit()` use `try?` on outbox enqueue (unlike `attachPhoto`, which surfaces the error) — consider parity.
- No unit test for the evidence enqueue-failure path (OfflineStore is `final`; needs an `Enqueueable` seam).
- A few residual magic sizes in signature/evidence UI.

### 4. Next phases (not started)
- **Phase 4** — Geofence.
- **Phase 5** — Factory360 / Virtual / Profile.
- Deferred workspace capabilities (documented, not silent): action forms, auto-violation display, factory verification, video/document evidence, resubmission/returned-sections gating, previous-inspection comparison, full conflict-resolution UI, geo/journey ops.

---

## Key interfaces (so the next session doesn't re-derive them)
- `WorkspaceStore` (`@MainActor`): `@Published sections:[SectionVM]`, `answers:[String:Answer]` (**keyed by `item.id.uuidString`**), `sync:SyncState`, `isLoading`, `errorMessage`, `progress:(answered,total)`, `evidenceCounts:[String:Int]`; methods `load()`, `answer(itemId:patch:)`, `attachPhoto(itemId:imageData:)`, `sync()`, `submit(ack:JSONValue)`; `var canSubmit`.
- Submission snapshot is keyed by **`item.code`** (server/web parity); everything else keys by `item.id.uuidString`.
- `WorkspaceView` takes `@ObservedObject store` → the navigation destination (`WorkspaceScreen`) **must own it via `@StateObject`**.
- Two `SyncState` enums exist (`InspectionApp.SyncState` vs `Components.SyncState`) — bridged file-locally in `WorkspaceView`.
