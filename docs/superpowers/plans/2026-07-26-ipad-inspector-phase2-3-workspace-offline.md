# iPad Inspector — Phase 2 + 3 (Inspection Workspace, Offline-first) Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let an inspector open an assigned inspection, work the checklist (answer items with autosave), attach photo evidence, sign, and submit — all **offline-first** on a GRDB (SQLite) drafts + outbox layer that syncs to the same Supabase backend with conflict detection and idempotent submit.

**Architecture:** A GRDB `OfflineStore` (drafts, packages cache, outbox, conflicts) + a `SyncEngine` that replays the outbox and detects response conflicts, both mirroring the PWA `lib/offline.ts` semantics. On top: workspace domain models + DTOs, a `WorkspaceRepository` (Supabase reads + writes) that goes through the outbox, a `@MainActor WorkspaceStore`, and SwiftUI checklist/evidence/signature/submit UI reached by tapping a visit.

**Tech Stack:** Swift 5.9, SwiftUI, GRDB 6+ (SQLite), Supabase Swift SDK, PencilKit (signature), PhotosUI/camera, XCTest.

## Global Constraints

- iPadOS 18, iPad-only, `com.mim.inspection`, Swift 5.9 language mode, app root `apps/ipad/`.
- Design: Saqeel tokens/components (Phase 0/1). Field density 52; status = glyph/dot + label. IBM Plex.
- **Real Supabase schema — use exact names/shapes (verbatim):**
  - `inspections`: `id, visit_id, status, package_version_id, started_at, submitted_at, context (jsonb), inspection_no`. status ∈ `not_started|in_progress|submitted|under_review|returned|approved|rejected|cancelled`; canonical UI uses `lifecycle_status` where present.
  - `package_versions`: `id, version_label, definition (jsonb), packages(code, title)`. `definition = { sections:[{key,title_en,title_ar,items:[itemCode]}], item_rules:{code:{requirement,conditional}}, item_snapshot?, action_forms? }`.
  - `inspection_items`: `id, code, title, response_model (jsonb), evidence_rule (jsonb), guidance_en, guidance_ar, score_excluded_on (text[])`. `response_model = { responses:[String], mapping:{value:{result,violation,action_form}}, conditional?, requirement, scoring_enabled?, score_excluded_on? }`. `evidence_rule = { on, type, min, mandatory, note }`.
  - `checklist_responses`: `id, inspection_id, item_id, response (jsonb {value,note,date}), is_complete, updated_at`. UNIQUE(inspection_id,item_id). `updated_at` is the conflict baseline.
  - `evidence`: `id, inspection_id, visit_id, linked_type ('item'), linked_id (item_id), evidence_type ('photo'), storage_path, captured_at, content_sha256, captured_by, synced_at, evidence_note`. Storage bucket **`evidence`**, path `\(visit_id ?? inspection_id)/\(name)`, upload with upsert; row upsert on `storage_path` ignoreDuplicates.
  - `submission_versions`: `id, inspection_id, version_number (>=1, unique per inspection), snapshot (jsonb), acknowledgement (jsonb {name,signed,signed_at,signature_data_url}), idempotency_key (text unique), submitted_by, submitted_at`.
- **Offline outbox op kinds (this slice):** `response`, `evidence`, `submit`. Payloads exactly per `lib/offline.ts` (see tasks). Replay order: **evidence → response → submit**. Idempotency: responses upsert on (inspection_id,item_id); evidence on storage_path; submit on idempotency_key (409/duplicate ⇒ treat as success).
- **Conflict rule (response):** at read, capture `baseline_updated_at`. On replay, if `server.updated_at > baseline && server.response != local.response` ⇒ record a Conflict (do not overwrite); else upsert.
- Tests run on the iPad simulator via xcodebuild (`iPad mini (A17 Pro)`), never `swift test` (UIKit/GRDB). Core package: `InspectionCore-Package` scheme. App target: `InspectionApp` scheme. GRDB pure-logic (store/outbox/sync/models) is unit-tested with an in-memory DB + stub Supabase.
- Commit per task; stage only `apps/ipad/`; never commit `*.xcodeproj`/`Secrets.local.xcconfig`.

## Deferred to later within Phase 2/3 (documented, not silent)
Action forms, auto-violation display, factory verification, video/document evidence, resubmission/returned-sections gating, previous-inspection comparison, geo/journey ops. Conflict **resolution UI** is minimal (surfaced + "keep server" reload) in this slice.

---

## File Structure
```
apps/ipad/
├── project.yml                         # add GRDB package dep
├── InspectionApp/
│   ├── Data/Offline/
│   │   ├── OfflineStore.swift           # GRDB: schema + drafts/packages/outbox/conflicts
│   │   ├── OutboxOp.swift               # Codable op kinds + payloads
│   │   └── SyncEngine.swift             # processOutbox + conflict detection
│   ├── Domain/
│   │   ├── Package.swift                # PackageDefinition, Section, ItemRule
│   │   ├── InspectionItem.swift         # item + ResponseModel + EvidenceRule + Answer
│   │   └── WorkspaceModels.swift        # WorkspaceData, SectionVM, ItemVM, completion
│   ├── Data/
│   │   ├── DTOs/WorkspaceRows.swift      # PackageVersionRow, ItemRow, ResponseRow, EvidenceRow
│   │   └── Repositories/WorkspaceRepository.swift  # fetch + write-through-outbox
│   └── Features/Workspace/
│       ├── WorkspaceStore.swift          # @MainActor store
│       ├── WorkspaceView.swift           # sections + items + submit bar
│       ├── ChecklistItemView.swift       # response controls + evidence + guidance
│       ├── EvidenceCapture.swift         # photo pick/camera → outbox
│       └── SignatureSheet.swift          # PencilKit signature + submit
└── InspectionAppTests/  (offline + models + store tests)
```

---

### Task 1: Add GRDB dependency

**Files:** Modify `apps/ipad/project.yml`.
**Interfaces:** Produces: GRDB.swift available to `import GRDB` in the app target.

- [ ] **Step 1:** Add the package + dependency to `project.yml`.
Under `packages:` add:
```yaml
  GRDB:
    url: https://github.com/groue/GRDB.swift
    from: "6.29.0"
```
Under target `InspectionApp` → `dependencies:` add:
```yaml
      - package: GRDB
        product: GRDB
```
- [ ] **Step 2:** Verify it resolves + builds.
Run: `cd apps/ipad && xcodegen generate && xcodebuild -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'generic/platform=iOS' build CODE_SIGNING_ALLOWED=NO 2>&1 | tail -3`
Expected: BUILD SUCCEEDED (GRDB resolves over network).
- [ ] **Step 3:** Commit.
```bash
git add apps/ipad/project.yml && git commit -m "build(ipad): add GRDB dependency for offline store"
```

---

### Task 2: OutboxOp Codable types

**Files:** Create `apps/ipad/InspectionApp/Data/Offline/OutboxOp.swift`; Test `apps/ipad/InspectionAppTests/OutboxOpTests.swift`.
**Interfaces:** Produces:
- `struct Answer: Codable, Equatable { var value: String?; var note: String?; var date: String? }`
- `enum OutboxOp: Codable, Equatable` with cases `.response(ResponseOp)`, `.evidence(EvidenceOp)`, `.submit(SubmitOp)`, each Codable with the exact payloads below, plus `var kind: String` (`"response"|"evidence"|"submit"`).
  - `ResponseOp { inspectionId, itemId: String; response: Answer; baselineUpdatedAt: String?; queuedAt: String }`
  - `EvidenceOp { inspectionId: String?; visitId: String?; linkedType: String; linkedId: String; evidenceType: String; name: String; mime: String; dataB64: String; capturedAt: String; sha256: String; queuedAt: String }`
  - `SubmitOp { inspectionId: String; versionNumber: Int; snapshot: JSONValue; idempotencyKey: String; acknowledgement: JSONValue; queuedAt: String }`
- `enum JSONValue: Codable, Equatable` (a minimal JSON container: object/array/string/number/bool/null) for `snapshot`/`acknowledgement` so arbitrary shapes round-trip.
- OutboxOp encodes with a `"kind"` discriminator so it persists as one JSON blob.

- [ ] **Step 1: Write the failing test**
```swift
import XCTest
@testable import InspectionApp

final class OutboxOpTests: XCTestCase {
    func test_responseOpRoundTrips() throws {
        let op = OutboxOp.response(.init(inspectionId: "i", itemId: "t",
            response: Answer(value: "compliant", note: "ok", date: nil),
            baselineUpdatedAt: "2026-07-26T00:00:00+00:00", queuedAt: "2026-07-26T00:00:01+00:00"))
        let data = try JSONEncoder().encode(op)
        let back = try JSONDecoder().decode(OutboxOp.self, from: data)
        XCTAssertEqual(op, back)
        XCTAssertEqual(op.kind, "response")
    }
    func test_submitOpCarriesArbitrarySnapshot() throws {
        let snap = JSONValue.object(["answers": .object(["CD-001": .string("compliant")]),
                                     "health_score": .number(87.5)])
        let op = OutboxOp.submit(.init(inspectionId: "i", versionNumber: 1, snapshot: snap,
            idempotencyKey: "k", acknowledgement: .object(["name": .string("A"), "signed": .bool(true)]),
            queuedAt: "t"))
        let back = try JSONDecoder().decode(OutboxOp.self, from: JSONEncoder().encode(op))
        XCTAssertEqual(op, back)
        XCTAssertEqual(op.kind, "submit")
    }
}
```
- [ ] **Step 2: Run to verify it fails** (app-target xcodebuild command from Global Constraints). Expected: `OutboxOp` undefined.
- [ ] **Step 3: Implement.** Write `OutboxOp.swift` with `Answer`, `JSONValue` (encode/decode covering object/array/string/number/bool/null), the three op structs, and `OutboxOp` with a `kind`-discriminated `Codable` (custom `init(from:)`/`encode(to:)` switching on `"kind"`). Provide `var kind: String`.
- [ ] **Step 4: Run to verify it passes.**
- [ ] **Step 5: Commit** `feat(ipad): add offline OutboxOp codable types`.

---

### Task 3: GRDB OfflineStore

**Files:** Create `apps/ipad/InspectionApp/Data/Offline/OfflineStore.swift`; Test `apps/ipad/InspectionAppTests/OfflineStoreTests.swift`.
**Interfaces:** Consumes `OutboxOp` (Task 2). Produces:
- `final class OfflineStore` wrapping a GRDB `DatabaseQueue`; `init(path: String)` and `static func inMemory() throws -> OfflineStore` (for tests).
- Migration creating tables: `drafts(key TEXT PRIMARY KEY, value BLOB)`, `packages(key TEXT PRIMARY KEY, value BLOB)`, `outbox(id INTEGER PRIMARY KEY AUTOINCREMENT, op BLOB NOT NULL, created_at TEXT)`, `conflicts(key TEXT PRIMARY KEY, item_id TEXT, local BLOB, server BLOB, detected_at TEXT)`.
- API: `saveDraft(inspectionId:itemId:Answer)`, `draft(inspectionId:itemId:) -> Answer?`, `allDrafts(inspectionId:) -> [String:Answer]`; `cachePackage(inspectionId:Data)`/`cachedPackage(inspectionId:) -> Data?`; `enqueue(_ OutboxOp) -> Int64`, `peekAll() -> [(id:Int64, op:OutboxOp)]`, `remove(id:)`, `outboxCount()`; `addConflict(key:itemId:local:server:)`, `conflicts() -> [ConflictRecord]`, `removeConflict(key:)`.

- [ ] **Step 1: Write the failing test**
```swift
import XCTest
@testable import InspectionApp

final class OfflineStoreTests: XCTestCase {
    func test_draftSaveAndRead() throws {
        let s = try OfflineStore.inMemory()
        try s.saveDraft(inspectionId: "i", itemId: "t", Answer(value: "compliant", note: nil, date: nil))
        XCTAssertEqual(s.draft(inspectionId: "i", itemId: "t")?.value, "compliant")
    }
    func test_outboxEnqueuePeekRemovePreservesOrder() throws {
        let s = try OfflineStore.inMemory()
        _ = try s.enqueue(.response(.init(inspectionId: "i", itemId: "a", response: Answer(value: "x", note: nil, date: nil), baselineUpdatedAt: nil, queuedAt: "1")))
        let id2 = try s.enqueue(.response(.init(inspectionId: "i", itemId: "b", response: Answer(value: "y", note: nil, date: nil), baselineUpdatedAt: nil, queuedAt: "2")))
        let all = s.peekAll()
        XCTAssertEqual(all.map { ($0.op as OutboxOp) }.count, 2)
        try s.remove(id: id2)
        XCTAssertEqual(s.outboxCount(), 1)
    }
    func test_conflictRecord() throws {
        let s = try OfflineStore.inMemory()
        try s.addConflict(key: "i:t", itemId: "t",
                          local: Answer(value: "a", note: nil, date: nil),
                          server: Answer(value: "b", note: nil, date: nil))
        XCTAssertEqual(s.conflicts().count, 1)
        try s.removeConflict(key: "i:t")
        XCTAssertEqual(s.conflicts().count, 0)
    }
}
```
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Implement** `OfflineStore` with GRDB `DatabaseQueue`, a `Migrator` creating the four tables, and the API above. Encode `Answer`/`OutboxOp` to JSON `Data` for BLOB columns; decode on read. `ConflictRecord { key, itemId, local: Answer, server: Answer, detectedAt: String }`.
- [ ] **Step 4: Run to verify it passes.**
- [ ] **Step 5: Commit** `feat(ipad): add GRDB OfflineStore (drafts, packages, outbox, conflicts)`.

---

### Task 4: SyncEngine (replay + conflict detection)

**Files:** Create `apps/ipad/InspectionApp/Data/Offline/SyncEngine.swift`; Test `apps/ipad/InspectionAppTests/SyncEngineTests.swift`.
**Interfaces:** Consumes `OfflineStore`, `OutboxOp`. Produces:
- `protocol RemoteSyncGateway { func serverResponse(inspectionId:String,itemId:String) async throws -> (response: Answer, updatedAt: String)?; func upsertResponse(inspectionId:String,itemId:String,response:Answer) async throws; func uploadEvidence(_ op: OutboxOp.EvidenceOp) async throws; func insertSubmission(_ op: OutboxOp.SubmitOp) async throws }`
- `enum SyncState { case synced, offline, pending, syncing, conflict, failed }`
- `final class SyncEngine` `init(store:gateway:isOnline:)` with `func process() async -> SyncState`: if `!isOnline()` → `.offline`; else replay `peekAll()` in order; per op run the gateway; response op does the conflict check (record + remove op, continue) else upsert + remove; evidence/submit call gateway then remove (submit: swallow "duplicate"/409 as success); stop on first real error → `.failed`; end `.synced` if outbox empty else `.pending`; `.conflict` if any conflicts exist.
- `StubGateway` (test target) with programmable server state + recorded calls.

- [ ] **Step 1: Write the failing test**
```swift
import XCTest
@testable import InspectionApp

final class SyncEngineTests: XCTestCase {
    func test_responseSyncsWhenNoConflict() async throws {
        let store = try OfflineStore.inMemory()
        _ = try store.enqueue(.response(.init(inspectionId: "i", itemId: "t",
            response: Answer(value: "compliant", note: nil, date: nil),
            baselineUpdatedAt: nil, queuedAt: "1")))
        let gw = StubGateway()  // no server row
        let engine = SyncEngine(store: store, gateway: gw, isOnline: { true })
        let state = await engine.process()
        XCTAssertEqual(state, .synced)
        XCTAssertEqual(store.outboxCount(), 0)
        XCTAssertEqual(gw.upserts.count, 1)
    }
    func test_responseRecordsConflictWhenServerNewerAndDifferent() async throws {
        let store = try OfflineStore.inMemory()
        _ = try store.enqueue(.response(.init(inspectionId: "i", itemId: "t",
            response: Answer(value: "compliant", note: nil, date: nil),
            baselineUpdatedAt: "2026-07-26T00:00:00+00:00", queuedAt: "1")))
        let gw = StubGateway()
        gw.server = ["i:t": (Answer(value: "non_compliant", note: nil, date: nil), "2026-07-26T01:00:00+00:00")]
        let engine = SyncEngine(store: store, gateway: gw, isOnline: { true })
        let state = await engine.process()
        XCTAssertEqual(state, .conflict)
        XCTAssertEqual(store.conflicts().count, 1)
        XCTAssertEqual(gw.upserts.count, 0)  // not overwritten
    }
    func test_offlineReturnsOffline() async throws {
        let engine = SyncEngine(store: try .inMemory(), gateway: StubGateway(), isOnline: { false })
        let state = await engine.process()
        XCTAssertEqual(state, .offline)
    }
}
```
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Implement** `SyncEngine`, `RemoteSyncGateway`, `SyncState`, and `StubGateway` (test target: `var server: [String:(Answer,String)]`, `private(set) var upserts/uploads/submits`). Compare timestamps as ISO strings via `ISO8601DateFormatter` (fractional-tolerant like `VisitRow`).
- [ ] **Step 4: Run to verify it passes.**
- [ ] **Step 5: Commit** `feat(ipad): add offline SyncEngine with response conflict detection`.

---

### Task 5: Workspace domain models + DTOs

**Files:** Create `apps/ipad/InspectionApp/Domain/Package.swift`, `apps/ipad/InspectionApp/Domain/InspectionItem.swift`, `apps/ipad/InspectionApp/Data/DTOs/WorkspaceRows.swift`; Test `apps/ipad/InspectionAppTests/WorkspaceDecodingTests.swift`.
**Interfaces:** Produces:
- Domain: `struct PackageDefinition: Codable { let sections: [Section]; ... }`, `struct Section { key; titleEn; titleAr; items:[String] }`, `struct InspectionItemDef { id; code; title; responseModel: ResponseModel; evidenceRule: EvidenceRule?; guidanceEn/ar }`, `struct ResponseModel { responses:[String]?; requirement:String? }` (mapping kept as `JSONValue?` — not needed to render), `struct EvidenceRule { on:String?; type:String?; min:Int?; mandatory:Bool? }`, `struct Answer` (already in Task 2).
- DTOs with snake_case CodingKeys: `PackageVersionRow { id; versionLabel; definition: PackageDefinition; packages: PkgRow? }`, `ItemRow` → `InspectionItemDef`, `ResponseRow { itemId; response: Answer?; updatedAt: String }`, `InspectionHeadRow { id; status; visitId; packageVersions: PackageVersionRow }`.
- The decoder tolerates the mixed timestamp formats (reuse the fractional-stripping strategy).

- [ ] **Step 1: Write the failing test** — decode a representative inspection+package JSON (sections with item codes, one item with `response_model.responses=["compliant","non_compliant","na"]` and `evidence_rule={on:"non_compliant",type:"photo",min:1,mandatory:true}`) and assert sections/items/response-options parse and an item maps to `InspectionItemDef`.
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Implement** the domain models + DTOs + `toDomain()` mappers.
- [ ] **Step 4: Run to verify it passes.**
- [ ] **Step 5: Commit** `feat(ipad): add workspace package/item domain models and DTOs`.

---

### Task 6: WorkspaceRepository (fetch + write-through-outbox) + Supabase gateway

**Files:** Create `apps/ipad/InspectionApp/Data/Repositories/WorkspaceRepository.swift`; add `SupabaseSyncGateway` (implements `RemoteSyncGateway`); Test `apps/ipad/InspectionAppTests/WorkspaceRepositoryTests.swift` (stub-based).
**Interfaces:** Consumes Supabase client, `OfflineStore`, DTOs. Produces:
- `protocol WorkspaceRepository { func loadWorkspace(inspectionId:String) async throws -> WorkspaceData; func openInspection(forVisit visitId:String) async throws -> String? }` where `WorkspaceData { inspection head, package definition, items:[InspectionItemDef], responses:[itemId:Answer & baseline] }`.
- `SupabaseWorkspaceRepository`: fetches `inspections` (embed `package_versions(definition,packages(code,title))`), `inspection_items` by codes, `checklist_responses` — and caches the package JSON to `OfflineStore`. `openInspection(forVisit:)` returns the inspection id for a visit (`inspections?visit_id=eq.…&select=id&limit=1`) or nil.
- `SupabaseSyncGateway: RemoteSyncGateway` doing the real `checklist_responses` read/upsert, evidence Storage upload + row upsert (bucket `evidence`, path `\(visitId ?? inspectionId)/\(name)`), and `submission_versions` insert + `inspections.status='submitted'` update.
- `StubWorkspaceRepository` (test target).

- [ ] **Step 1: Write the failing test** — stub returns a `WorkspaceData`; assert `loadWorkspace` yields the sections/items/responses; assert `openInspection` returns the stubbed id.
- [ ] **Step 2–4:** fail → implement → pass (use the app-target xcodebuild command).
- [ ] **Step 5: Commit** `feat(ipad): add WorkspaceRepository + Supabase sync gateway`.

---

### Task 7: WorkspaceStore

**Files:** Create `apps/ipad/InspectionApp/Features/Workspace/WorkspaceStore.swift`; Test `apps/ipad/InspectionAppTests/WorkspaceStoreTests.swift`.
**Interfaces:** Consumes `WorkspaceRepository`, `OfflineStore`, `SyncEngine`. Produces `@MainActor final class WorkspaceStore: ObservableObject`:
- `@Published private(set) var sections:[SectionVM]`, `@Published private(set) var answers:[String:Answer]`, `@Published private(set) var sync: SyncState`, `@Published private(set) var isLoading`, `@Published var errorMessage`, `@Published private(set) var progress: (answered:Int, total:Int)`.
- `init(inspectionId:repository:store:engineFactory:todayProvider:)`.
- `func load() async` — loads workspace (or cached package offline), hydrates answers from server + overlays GRDB drafts.
- `func answer(itemId:String, patch: Answer) async` — merges, updates `answers`, `store.saveDraft`, if `value != nil` `store.enqueue(.response(...))` with baseline, recomputes `progress`, then `await sync()`.
- `func sync() async` — runs `SyncEngine.process()` and sets `sync`.
- `func canSubmit: Bool` — all `requirement=="required"` items answered (evidence-mandatory gating deferred/simplified: required items answered).
- `func submit(ack: JSONValue) async` — build snapshot JSONValue (answers/notes/dates/context), compute next version (loaded), enqueue `.submit`, set status, `await sync()`.

- [ ] **Step 1: Write the failing tests** (`@MainActor`): load populates sections/answers/progress from a stub repo; `answer` enqueues a response op into the injected in-memory `OfflineStore` and updates progress; `submit` enqueues a submit op.
- [ ] **Step 2–4:** fail → implement → pass.
- [ ] **Step 5: Commit** `feat(ipad): add WorkspaceStore (answer autosave + outbox + submit)`.

---

### Task 8: Checklist UI (sections + item response controls)

**Files:** Create `apps/ipad/InspectionApp/Features/Workspace/WorkspaceView.swift`, `apps/ipad/InspectionApp/Features/Workspace/ChecklistItemView.swift`; Test `apps/ipad/InspectionAppTests/ChecklistItemLogicTests.swift`.
**Interfaces:** Consumes `WorkspaceStore`, tokens/components. Produces:
- `enum ResponseControlKind { case choice([String]); case text; case date }` + pure `static func control(for item: InspectionItemDef) -> ResponseControlKind` (choice if `responses` non-empty; date if a `value_date` response; else text). Unit-test this pure mapping.
- `ChecklistItemView` — item code (mono), title, guidance (collapsible), and the response control (segmented choice / text field / date picker) bound through `store.answer`, plus an evidence affordance (Task 9) and a "required" marker.
- `WorkspaceView` — a `List`/`ScrollView` of sections (section header + completion) with `ChecklistItemView` rows, an `InspectionHeader(title: inspectionNo ?? "Inspection", sync: store.sync)`, a sticky bottom **Submit** bar showing `progress` and enabling when `canSubmit`.

- [ ] **Step 1: Write the failing test** — `ChecklistItemLogicTests`: choice item → `.choice([...])`; text item → `.text`; date item → `.date`.
- [ ] **Step 2–4:** fail → implement → pass (build the app).
- [ ] **Step 5: Commit** `feat(ipad): add checklist workspace UI with response controls`.

---

### Task 9: Photo evidence capture

**Files:** Create `apps/ipad/InspectionApp/Features/Workspace/EvidenceCapture.swift`; add camera/photo Info.plist usage (already present). Test `apps/ipad/InspectionAppTests/EvidenceOpBuildTests.swift`.
**Interfaces:** Consumes `WorkspaceStore`/`OfflineStore`. Produces:
- Pure `static func makeEvidenceOp(inspectionId:visitId:itemId:imageData:Data, capturedAt:String) -> OutboxOp.EvidenceOp` — computes `sha256` (CryptoKit), `name = "\(itemId)-\(sha8).jpg"`, `mime="image/jpeg"`, `dataB64`, `linkedType="item"`, `linkedId=itemId`, `evidenceType="photo"`. Unit-test it (deterministic name/sha for fixed bytes).
- `WorkspaceStore.attachPhoto(itemId:imageData:) async` — builds the op, `store.enqueue`, tracks queued count per item, `await sync()`.
- `EvidenceCaptureButton` — PhotosPicker/camera → JPEG data → `store.attachPhoto`; shows queued-evidence thumbnails/count on the item.

- [ ] **Step 1: Write the failing test** — `makeEvidenceOp` on fixed bytes yields stable sha/name, correct linkedType/evidenceType, non-empty base64.
- [ ] **Step 2–4:** fail → implement → pass.
- [ ] **Step 5: Commit** `feat(ipad): add photo evidence capture into the offline outbox`.

---

### Task 10: Signature + submit

**Files:** Create `apps/ipad/InspectionApp/Features/Workspace/SignatureSheet.swift`; Test `apps/ipad/InspectionAppTests/SubmissionSnapshotTests.swift`.
**Interfaces:** Consumes `WorkspaceStore`. Produces:
- `SignatureSheet` — a PencilKit `PKCanvasView` (or a Canvas-based drawing) capturing strokes; "Clear"/"Confirm"; on confirm produces `signature_data_url` (PNG base64) + signer name + `signed_at`, and calls `store.submit(ack:)`.
- Pure `static func buildAcknowledgement(name:String, signedAt:String, pngBase64:String) -> JSONValue` and `WorkspaceStore.buildSnapshot() -> JSONValue` (answers by item code, notes, dates, context, `submitted_offline`). Unit-test snapshot/ack shapes.

- [ ] **Step 1: Write the failing test** — `buildSnapshot` maps answered items to `answers[code]=value` and includes `notes`/`dates`; `buildAcknowledgement` yields `{name,signed:true,signed_at,signature_data_url}`.
- [ ] **Step 2–4:** fail → implement → pass.
- [ ] **Step 5: Commit** `feat(ipad): add signature capture and submission snapshot`.

---

### Task 11: Wire Visits → Workspace navigation + sync badge

**Files:** Modify `apps/ipad/InspectionApp/Features/Visits/VisitsView.swift` (and `VisitCard` onOpen), `apps/ipad/InspectionApp/Features/Shell/RootShellView.swift` if needed. Test `apps/ipad/InspectionAppTests/WorkspaceRouteTests.swift`.
**Interfaces:** Consumes `WorkspaceRepository`, `WorkspaceStore`. Produces:
- Tapping a `VisitCard` pushes (NavigationStack) a `WorkspaceView` for that visit's inspection: resolve inspection id via `WorkspaceRepository.openInspection(forVisit:)`; if nil, show a "Not started — startup flow arrives in Phase 4" state (no crash).
- A pure `static func route(for item: VisitListItem) -> WorkspaceRoute` (`.open(inspectionHint)` vs `.notStarted`) driven by `inspectionLifecycle` — unit-test it.
- Header shows the workspace `sync` state (Synced/Pending/Offline/Conflict).

- [ ] **Step 1: Write the failing test** — `route(for:)`: an item with lifecycle `.in_progress`/`.returned` → `.open`; `nil` (not started) → `.notStarted`.
- [ ] **Step 2–4:** fail → implement → pass; then BUILD + launch and sign in with `inspector@mim.gov.sa` → open an in-progress visit → answer items → attach a photo → sign → submit; confirm the sync badge and that the submission reaches Supabase.
- [ ] **Step 5: Commit** `feat(ipad): open the inspection workspace from a visit`.

---

## Self-Review

**Spec coverage (design spec §7 Inspection Workspace + §8 Offline-first, core slice):**
- Offline store (drafts/packages/outbox/conflicts) → Tasks 2–4. ✅
- Load package/checklist/responses (+ offline cache) → Tasks 5–7. ✅
- Answer items with autosave + outbox + sync + conflict detection → Tasks 3,4,7,8. ✅
- Photo evidence → outbox → Storage → Task 9. ✅
- Signature + submit (idempotent, offline-capable) → Tasks 4,7,10. ✅
- Visits → Workspace navigation + sync badge → Task 11. ✅
- Deferred (documented): action forms, violations display, factory verify, video/doc evidence, resubmission gating, previous comparison, full conflict-resolution UI, geo ops.

**Placeholder scan:** none — each task has real test code and interfaces; UI tasks specify concrete controls.

**Type consistency:** `Answer`, `OutboxOp` (+ payloads), `OfflineStore` API, `RemoteSyncGateway`/`SyncEngine`/`SyncState`, `WorkspaceData`, `InspectionItemDef`, `WorkspaceStore` API used identically across tasks. Storage path `\(visitId ?? inspectionId)/\(name)`, submit idempotency, and the response conflict rule match `lib/offline.ts` verbatim.

## Notes for executor
- GRDB + Supabase both link into the app target; offline logic (Tasks 2–5, 9,10 pure parts) is unit-tested with an in-memory GRDB and stub gateway — no network in tests.
- Only photo evidence in this slice; keep `evidence_type="photo"`, bucket `evidence`.
- Manual E2E needs a real inspector login (gitignored `Secrets.local.xcconfig`) and a visit that already has an in-progress inspection.
- Backend visits-query RLS perf limitation (from Phase 1) is unrelated; the workspace fetches a single inspection by id (fast).
