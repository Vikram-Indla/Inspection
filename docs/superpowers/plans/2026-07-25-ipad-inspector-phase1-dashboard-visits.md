# iPad Inspector — Phase 1 (Dashboard + Visits) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the signed-in inspector a working **Dashboard** (KPI cards + attention rail) and **Visits** list (their assignments, filterable), reading live data from the same Supabase backend, wired into the native tab shell.

**Architecture:** Clean Architecture continues from Phase 0. New `Domain` value types + `Codable` DTOs, a `VisitRepository` (protocol + Supabase impl + stub) using PostgREST embedding, `@MainActor` stores (`DashboardStore`, `VisitsStore`, `ProfileStore`) that expose `@Published` state, and SwiftUI feature views that replace the placeholder tab content in `RootShellView`. KPIs are computed app-side from fetched rows (no server RPC exists for them yet).

**Tech Stack:** Swift 5.9 language mode, SwiftUI, Supabase Swift SDK 2.x (`client.from("table").select(...).execute().value`), XCTest. Offline caching (GRDB) is Phase 3 — this phase is online-only.

## Global Constraints

- Platform iPadOS 18, iPad-only, `com.mim.inspection`. `SWIFT_VERSION 5.9` language mode. App root `apps/ipad/`.
- Design tokens are canonical Saqeel (Phase 0 `DesignSystem`/`Components`). Field density 52 / ≥52 touch targets. **Status is glyph + label, never color alone** — use `StatusLozenge`. Primary green only for principal actions; info blue is informational only.
- Data is the **real Supabase schema** (do NOT invent columns/enums). Exact names, verbatim:
  - `visits`: `id, factory_id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, priority, notes, planner_lat, planner_lng, cancellation_reason, package_version_id, execution_date, created_at`.
    - `execution_mode` ∈ `physical | virtual`. `planning_status` ∈ `draft | published | returned | cancelled | expired`. `operational_state` ∈ `new | prepared | on_the_way | arrived | executing | submitted | under_review`.
  - `assignments`: `id, visit_id, inspector_id, method, status, return_reason, candidates, created_at`. `status` ∈ `assigned | preparing | ready | returned`. Inspector filter: `inspector_id = auth.uid()` (RLS already enforces this).
  - `factories`: `id, factory_code, name, cr_number, license_number, region, city, activity_class, official_lat, official_lng, source, risk_score, risk_band, risk_version, employees_total, employees_saudi, capital_invested, production_capacity_note, created_at`. `risk_band` ∈ `low | medium | high` (nullable).
  - `inspections`: `id, visit_id, status, lifecycle_status, package_version_id, started_at, submitted_at`. Use `lifecycle_status` (∈ `new | in_progress | returned | approved | rejected | cancelled`) for canonical UI state; `status` is the legacy free-text column.
  - `profiles`: `user_id, full_name, email, region, org_scope, created_at`. `user_roles`: `user_id, role_key` (inspector = `'inspector'`).
- RLS already scopes reads to the current inspector; a plain `select` on `visits` returns only their assigned visits. Do NOT add client-side `inspector_id` filters as a security measure (they are display conveniences only).
- **PostgREST/JSON decoding:** column names are `snake_case`. DTOs MUST use explicit `CodingKeys` mapping to the exact snake_case names (do not rely on a global key strategy). Timestamps are ISO8601 (`timestamptz`); the Supabase client's default decoder handles them — decode into `Date`. `execution_date` is a bare `date` (`"2026-07-25"`) — decode as `String` (not `Date`) to avoid time-zone/format mismatch, and parse only for display.
- **Query pattern (verbatim shape):** `try await SupabaseClientProvider.shared.from("visits").select("<embed string>").execute().value` returning `[VisitRow]`.
- Tests run on an iPad simulator (`iPad mini (A17 Pro)`, iOS 18) via xcodebuild — never `swift test` (UIKit). Core package: `xcodebuild test -scheme InspectionCore-Package -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)'`. App target: `cd apps/ipad && xcodegen generate && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`.
- Commit after every task; conventional messages; stage only `apps/ipad/`; never commit `*.xcodeproj` or `Secrets.local.xcconfig`.

---

## File Structure

```
apps/ipad/InspectionApp/
├── Domain/
│   ├── VisitEnums.swift          # ExecutionMode, PlanningStatus, OperationalState, AssignmentStatus, InspectionLifecycle (String enums)
│   ├── Visit.swift               # domain model + VisitListItem (visit + factory + inspection)
│   └── Factory.swift             # Factory domain model
├── Data/
│   ├── DTOs/
│   │   └── VisitRow.swift        # Codable rows with embedded factory + inspection, + toDomain()
│   └── Repositories/
│       ├── VisitRepository.swift # protocol + SupabaseVisitRepository
│       └── ProfileRepository.swift # protocol + SupabaseProfileRepository (identity for Profile tab)
├── Features/
│   ├── Dashboard/
│   │   ├── DashboardStore.swift  # @MainActor store: KPIs + attention items
│   │   ├── DashboardKPIs.swift   # pure KPI computation (testable, no I/O)
│   │   └── DashboardView.swift
│   ├── Visits/
│   │   ├── VisitsStore.swift     # @MainActor store: list + status filter
│   │   ├── VisitFilter.swift     # pure filter logic (testable)
│   │   └── VisitsView.swift      # list + VisitCard + segmented filter
│   ├── Profile/
│   │   ├── ProfileStore.swift    # @MainActor store: identity
│   │   └── ProfileView.swift     # identity + sign out
│   └── Shell/
│       └── RootShellView.swift   # MODIFY: real Dashboard/Visits/Profile tabs
└── InspectionAppTests/
    ├── VisitRowDecodingTests.swift
    ├── VisitRepositoryTests.swift        # stub-based
    ├── DashboardKPIsTests.swift
    ├── VisitFilterTests.swift
    ├── DashboardStoreTests.swift
    ├── VisitsStoreTests.swift
    └── ProfileStoreTests.swift
```

---

### Task 1: Domain enums + Visit/Factory models

**Files:**
- Create: `apps/ipad/InspectionApp/Domain/VisitEnums.swift`
- Create: `apps/ipad/InspectionApp/Domain/Factory.swift`
- Create: `apps/ipad/InspectionApp/Domain/Visit.swift`
- Test: `apps/ipad/InspectionAppTests/VisitEnumsTests.swift`

**Interfaces:**
- Produces:
  - `enum ExecutionMode: String { case physical, virtual }` — plus `var isVirtual: Bool`.
  - `enum PlanningStatus: String { case draft, published, returned, cancelled, expired }`.
  - `enum OperationalState: String { case new, prepared, on_the_way, arrived, executing, submitted, under_review }`.
  - `enum AssignmentStatus: String { case assigned, preparing, ready, returned }`.
  - `enum InspectionLifecycle: String { case new, in_progress, returned, approved, rejected, cancelled }`.
  - Each enum has a **failable-safe** `init(safe:)` static: `static func from(_ raw: String?) -> Self?` returning nil on unknown (so unknown server values never crash the app).
  - `struct Factory: Identifiable, Equatable` with `id: UUID, name: String, factoryCode: String?, city: String?, region: String?, licenseNumber: String?, crNumber: String?, activityClass: String?, riskBand: String?, riskScore: Double?`.
  - `struct Visit: Identifiable, Equatable` with `id: UUID, factoryId: UUID, visitType: String, executionMode: ExecutionMode, planningStatus: PlanningStatus, operationalState: OperationalState, windowStart: Date, windowEnd: Date, executionDate: String?, priority: String?`.
  - `struct VisitListItem: Identifiable, Equatable` with `var id: UUID { visit.id }`, `let visit: Visit`, `let factory: Factory?`, `let inspectionLifecycle: InspectionLifecycle?`.

- [ ] **Step 1: Write the failing test**

`apps/ipad/InspectionAppTests/VisitEnumsTests.swift`:
```swift
import XCTest
@testable import InspectionApp

final class VisitEnumsTests: XCTestCase {
    func test_executionModeParsesKnownValues() {
        XCTAssertEqual(ExecutionMode.from("physical"), .physical)
        XCTAssertEqual(ExecutionMode.from("virtual"), .virtual)
        XCTAssertTrue(ExecutionMode.virtual.isVirtual)
        XCTAssertFalse(ExecutionMode.physical.isVirtual)
    }

    func test_unknownEnumValueReturnsNilNotCrash() {
        XCTAssertNil(PlanningStatus.from("banana"))
        XCTAssertNil(OperationalState.from(nil))
        XCTAssertNil(InspectionLifecycle.from("weird"))
    }

    func test_operationalStateUnderscoreValues() {
        XCTAssertEqual(OperationalState.from("on_the_way"), .on_the_way)
        XCTAssertEqual(OperationalState.from("under_review"), .under_review)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad && xcodegen generate && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: FAIL — `ExecutionMode` undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/InspectionApp/Domain/VisitEnums.swift`:
```swift
import Foundation

public protocol SafeRawEnum: RawRepresentable where RawValue == String {}
public extension SafeRawEnum {
    static func from(_ raw: String?) -> Self? {
        guard let raw else { return nil }
        return Self(rawValue: raw)
    }
}

enum ExecutionMode: String, SafeRawEnum { case physical, virtual
    var isVirtual: Bool { self == .virtual }
}
enum PlanningStatus: String, SafeRawEnum { case draft, published, returned, cancelled, expired }
enum OperationalState: String, SafeRawEnum {
    case new, prepared, on_the_way, arrived, executing, submitted, under_review
}
enum AssignmentStatus: String, SafeRawEnum { case assigned, preparing, ready, returned }
enum InspectionLifecycle: String, SafeRawEnum {
    case new, in_progress, returned, approved, rejected, cancelled
}
```

`apps/ipad/InspectionApp/Domain/Factory.swift`:
```swift
import Foundation

struct Factory: Identifiable, Equatable {
    let id: UUID
    let name: String
    let factoryCode: String?
    let city: String?
    let region: String?
    let licenseNumber: String?
    let crNumber: String?
    let activityClass: String?
    let riskBand: String?
    let riskScore: Double?
}
```

`apps/ipad/InspectionApp/Domain/Visit.swift`:
```swift
import Foundation

struct Visit: Identifiable, Equatable {
    let id: UUID
    let factoryId: UUID
    let visitType: String
    let executionMode: ExecutionMode
    let planningStatus: PlanningStatus
    let operationalState: OperationalState
    let windowStart: Date
    let windowEnd: Date
    let executionDate: String?
    let priority: String?
}

struct VisitListItem: Identifiable, Equatable {
    var id: UUID { visit.id }
    let visit: Visit
    let factory: Factory?
    let inspectionLifecycle: InspectionLifecycle?
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/InspectionApp/Domain apps/ipad/InspectionAppTests/VisitEnumsTests.swift
git commit -m "feat(ipad): add visit/factory domain models and safe enums"
```

---

### Task 2: VisitRow DTO + decoding

**Files:**
- Create: `apps/ipad/InspectionApp/Data/DTOs/VisitRow.swift`
- Test: `apps/ipad/InspectionAppTests/VisitRowDecodingTests.swift`

**Interfaces:**
- Consumes: `Visit`, `Factory`, enums (Task 1).
- Produces:
  - `struct VisitRow: Decodable` with `CodingKeys` mapping to the exact PostgREST embed response: top-level visit columns + embedded `factories` (single object, key `factories`) + embedded `inspections` (array, key `inspections`).
  - `func toListItem() -> VisitListItem?` — returns nil if required fields (id/factory_id/enums) can't be built; picks the inspection's `lifecycle_status` (first inspection if present).
  - `static let selectClause = "id, factory_id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, execution_date, priority, factories(id, name, factory_code, city, region, license_number, cr_number, activity_class, risk_band, risk_score), inspections(lifecycle_status)"` — the exact PostgREST `select()` string used by the repository.

- [ ] **Step 1: Write the failing test**

`apps/ipad/InspectionAppTests/VisitRowDecodingTests.swift`:
```swift
import XCTest
@testable import InspectionApp

final class VisitRowDecodingTests: XCTestCase {
    // Mirrors a real PostgREST embed response for the visits select.
    let json = """
    [{
      "id": "11111111-1111-1111-1111-111111111111",
      "factory_id": "22222222-2222-2222-2222-222222222222",
      "visit_type": "periodic",
      "execution_mode": "physical",
      "planning_status": "published",
      "operational_state": "new",
      "window_start": "2026-07-25T06:00:00+00:00",
      "window_end": "2026-07-26T06:00:00+00:00",
      "execution_date": "2026-07-25",
      "priority": "high",
      "factories": {
        "id": "22222222-2222-2222-2222-222222222222",
        "name": "Alamal Plastics",
        "factory_code": "F-001",
        "city": "Riyadh",
        "region": "Central",
        "license_number": "LIC-9",
        "cr_number": "CR-9",
        "activity_class": "Plastics",
        "risk_band": "high",
        "risk_score": 82.5
      },
      "inspections": [ { "lifecycle_status": "returned" } ]
    }]
    """.data(using: .utf8)!

    func test_decodesEmbeddedVisitRow() throws {
        let rows = try VisitRow.decoder().decode([VisitRow].self, from: json)
        XCTAssertEqual(rows.count, 1)
        let item = rows[0].toListItem()
        XCTAssertNotNil(item)
        XCTAssertEqual(item?.visit.visitType, "periodic")
        XCTAssertEqual(item?.visit.executionMode, .physical)
        XCTAssertEqual(item?.visit.planningStatus, .published)
        XCTAssertEqual(item?.visit.executionDate, "2026-07-25")
        XCTAssertEqual(item?.factory?.name, "Alamal Plastics")
        XCTAssertEqual(item?.factory?.riskBand, "high")
        XCTAssertEqual(item?.inspectionLifecycle, .returned)
    }

    func test_handlesMissingFactoryAndInspection() throws {
        let minimal = """
        [{ "id":"11111111-1111-1111-1111-111111111111",
           "factory_id":"22222222-2222-2222-2222-222222222222",
           "visit_type":"immediate","execution_mode":"virtual",
           "planning_status":"draft","operational_state":"new",
           "window_start":"2026-07-25T06:00:00+00:00",
           "window_end":"2026-07-26T06:00:00+00:00",
           "execution_date":null,"priority":null,
           "factories":null,"inspections":[] }]
        """.data(using: .utf8)!
        let item = try VisitRow.decoder().decode([VisitRow].self, from: minimal)[0].toListItem()
        XCTAssertNotNil(item)
        XCTAssertNil(item?.factory)
        XCTAssertNil(item?.inspectionLifecycle)
        XCTAssertEqual(item?.visit.executionMode, .virtual)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: FAIL — `VisitRow` undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/InspectionApp/Data/DTOs/VisitRow.swift`:
```swift
import Foundation

struct VisitRow: Decodable {
    let id: UUID
    let factoryId: UUID
    let visitType: String
    let executionMode: String
    let planningStatus: String
    let operationalState: String
    let windowStart: Date
    let windowEnd: Date
    let executionDate: String?
    let priority: String?
    let factories: FactoryRow?
    let inspections: [InspectionRow]

    enum CodingKeys: String, CodingKey {
        case id
        case factoryId = "factory_id"
        case visitType = "visit_type"
        case executionMode = "execution_mode"
        case planningStatus = "planning_status"
        case operationalState = "operational_state"
        case windowStart = "window_start"
        case windowEnd = "window_end"
        case executionDate = "execution_date"
        case priority
        case factories
        case inspections
    }

    struct FactoryRow: Decodable {
        let id: UUID
        let name: String
        let factoryCode: String?
        let city: String?
        let region: String?
        let licenseNumber: String?
        let crNumber: String?
        let activityClass: String?
        let riskBand: String?
        let riskScore: Double?
        enum CodingKeys: String, CodingKey {
            case id, name, city, region
            case factoryCode = "factory_code"
            case licenseNumber = "license_number"
            case crNumber = "cr_number"
            case activityClass = "activity_class"
            case riskBand = "risk_band"
            case riskScore = "risk_score"
        }
    }

    struct InspectionRow: Decodable {
        let lifecycleStatus: String
        enum CodingKeys: String, CodingKey { case lifecycleStatus = "lifecycle_status" }
    }

    static let selectClause = "id, factory_id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, execution_date, priority, factories(id, name, factory_code, city, region, license_number, cr_number, activity_class, risk_band, risk_score), inspections(lifecycle_status)"

    /// A JSONDecoder configured like the Supabase client (ISO8601 with fractional seconds).
    static func decoder() -> JSONDecoder {
        let d = JSONDecoder()
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        d.dateDecodingStrategy = .custom { decoder in
            let s = try decoder.singleValueContainer().decode(String.self)
            if let date = iso.date(from: s) { return date }
            let iso2 = ISO8601DateFormatter(); iso2.formatOptions = [.withInternetDateTime]
            if let date = iso2.date(from: s) { return date }
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath,
                                                    debugDescription: "Bad date \(s)"))
        }
        return d
    }

    func toListItem() -> VisitListItem? {
        guard let mode = ExecutionMode.from(executionMode),
              let plan = PlanningStatus.from(planningStatus),
              let state = OperationalState.from(operationalState) else { return nil }
        let visit = Visit(id: id, factoryId: factoryId, visitType: visitType,
                          executionMode: mode, planningStatus: plan, operationalState: state,
                          windowStart: windowStart, windowEnd: windowEnd,
                          executionDate: executionDate, priority: priority)
        let factory = factories.map {
            Factory(id: $0.id, name: $0.name, factoryCode: $0.factoryCode, city: $0.city,
                    region: $0.region, licenseNumber: $0.licenseNumber, crNumber: $0.crNumber,
                    activityClass: $0.activityClass, riskBand: $0.riskBand, riskScore: $0.riskScore)
        }
        let lifecycle = inspections.first.flatMap { InspectionLifecycle.from($0.lifecycleStatus) }
        return VisitListItem(visit: visit, factory: factory, inspectionLifecycle: lifecycle)
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/InspectionApp/Data/DTOs/VisitRow.swift apps/ipad/InspectionAppTests/VisitRowDecodingTests.swift
git commit -m "feat(ipad): add VisitRow DTO with embedded factory/inspection decoding"
```

---

### Task 3: VisitRepository (protocol + Supabase impl + stub)

**Files:**
- Create: `apps/ipad/InspectionApp/Data/Repositories/VisitRepository.swift`
- Create: `apps/ipad/InspectionAppTests/StubVisitRepository.swift`
- Test: `apps/ipad/InspectionAppTests/VisitRepositoryTests.swift`

**Interfaces:**
- Consumes: `VisitRow` (Task 2), `SupabaseClientProvider` (Phase 0), `VisitListItem`.
- Produces:
  - `protocol VisitRepository { func fetchAssignedVisits() async throws -> [VisitListItem] }`.
  - `final class SupabaseVisitRepository: VisitRepository` — queries `from("visits").select(VisitRow.selectClause).order("window_start", ascending: true).execute()`, decodes `[VisitRow]` via `VisitRow.decoder()` from `response.data`, maps `.compactMap { $0.toListItem() }`.
  - `StubVisitRepository` (test target): returns an injected `[VisitListItem]` or throws an injected error.

- [ ] **Step 1: Write the failing test**

`apps/ipad/InspectionAppTests/StubVisitRepository.swift`:
```swift
import Foundation
@testable import InspectionApp

final class StubVisitRepository: VisitRepository {
    var items: [VisitListItem] = []
    var error: Error?
    private(set) var fetchCount = 0
    func fetchAssignedVisits() async throws -> [VisitListItem] {
        fetchCount += 1
        if let error { throw error }
        return items
    }
}
```

`apps/ipad/InspectionAppTests/VisitRepositoryTests.swift`:
```swift
import XCTest
@testable import InspectionApp

final class VisitRepositoryTests: XCTestCase {
    func test_stubReturnsInjectedItems() async throws {
        let repo = StubVisitRepository()
        repo.items = [Self.sampleItem(type: "periodic")]
        let out = try await repo.fetchAssignedVisits()
        XCTAssertEqual(out.count, 1)
        XCTAssertEqual(out.first?.visit.visitType, "periodic")
        XCTAssertEqual(repo.fetchCount, 1)
    }

    func test_stubPropagatesError() async {
        let repo = StubVisitRepository()
        repo.error = NSError(domain: "net", code: 1)
        do { _ = try await repo.fetchAssignedVisits(); XCTFail("should throw") }
        catch { /* expected */ }
    }

    static func sampleItem(type: String,
                           lifecycle: InspectionLifecycle? = nil,
                           executionDate: String? = "2026-07-25") -> VisitListItem {
        let v = Visit(id: UUID(), factoryId: UUID(), visitType: type,
                      executionMode: .physical, planningStatus: .published,
                      operationalState: .new, windowStart: Date(), windowEnd: Date(),
                      executionDate: executionDate, priority: nil)
        return VisitListItem(visit: v, factory: nil, inspectionLifecycle: lifecycle)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: FAIL — `VisitRepository` undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/InspectionApp/Data/Repositories/VisitRepository.swift`:
```swift
import Foundation
import Supabase

protocol VisitRepository {
    func fetchAssignedVisits() async throws -> [VisitListItem]
}

final class SupabaseVisitRepository: VisitRepository {
    private let client: SupabaseClient
    init(client: SupabaseClient = SupabaseClientProvider.shared) { self.client = client }

    func fetchAssignedVisits() async throws -> [VisitListItem] {
        // RLS scopes rows to the signed-in inspector's assigned visits.
        let response = try await client
            .from("visits")
            .select(VisitRow.selectClause)
            .order("window_start", ascending: true)
            .execute()
        let rows = try VisitRow.decoder().decode([VisitRow].self, from: response.data)
        return rows.compactMap { $0.toListItem() }
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/InspectionApp/Data/Repositories/VisitRepository.swift apps/ipad/InspectionAppTests/StubVisitRepository.swift apps/ipad/InspectionAppTests/VisitRepositoryTests.swift
git commit -m "feat(ipad): add VisitRepository (Supabase impl + stub)"
```

---

### Task 4: Dashboard KPI computation (pure)

**Files:**
- Create: `apps/ipad/InspectionApp/Features/Dashboard/DashboardKPIs.swift`
- Test: `apps/ipad/InspectionAppTests/DashboardKPIsTests.swift`

**Interfaces:**
- Consumes: `VisitListItem`, enums.
- Produces:
  - `struct DashboardKPIs: Equatable { let today: Int; let remaining: Int; let needAttention: Int; let inProgress: Int }`.
  - `static func compute(from items: [VisitListItem], todayISODate: String) -> DashboardKPIs` — pure, deterministic:
    - `today` = items whose `visit.executionDate == todayISODate` (fallback: `windowStart` date string == today) AND `planningStatus == .published`.
    - `remaining` = today's items where `inspectionLifecycle != .approved && operationalState != .submitted`.
    - `needAttention` = items where `inspectionLifecycle == .returned`.
    - `inProgress` = items where `inspectionLifecycle == .in_progress`.
  - `static func attentionItems(from items: [VisitListItem]) -> [VisitListItem]` — items with `inspectionLifecycle == .returned` (returned first), then `.new`/nil drafts left for later phases (Phase 1: returned only).

- [ ] **Step 1: Write the failing test**

`apps/ipad/InspectionAppTests/DashboardKPIsTests.swift`:
```swift
import XCTest
@testable import InspectionApp

final class DashboardKPIsTests: XCTestCase {
    private func item(date: String?, lifecycle: InspectionLifecycle?,
                      state: OperationalState = .new,
                      plan: PlanningStatus = .published) -> VisitListItem {
        let v = Visit(id: UUID(), factoryId: UUID(), visitType: "periodic",
                      executionMode: .physical, planningStatus: plan, operationalState: state,
                      windowStart: Date(), windowEnd: Date(), executionDate: date, priority: nil)
        return VisitListItem(visit: v, factory: nil, inspectionLifecycle: lifecycle)
    }

    func test_countsTodayRemainingAttentionInProgress() {
        let today = "2026-07-25"
        let items = [
            item(date: today, lifecycle: nil),                      // today, remaining
            item(date: today, lifecycle: .in_progress),             // today, remaining, in-progress
            item(date: today, lifecycle: .approved),                // today, NOT remaining
            item(date: "2026-07-20", lifecycle: .returned),         // not today, attention
            item(date: today, lifecycle: nil, state: .submitted),   // today, submitted → not remaining
        ]
        let k = DashboardKPIs.compute(from: items, todayISODate: today)
        XCTAssertEqual(k.today, 4)          // four with executionDate == today
        XCTAssertEqual(k.remaining, 2)      // today & not approved & not submitted
        XCTAssertEqual(k.needAttention, 1)  // one returned
        XCTAssertEqual(k.inProgress, 1)
    }

    func test_attentionItemsAreReturnedOnes() {
        let items = [item(date: nil, lifecycle: .returned), item(date: nil, lifecycle: .approved)]
        XCTAssertEqual(DashboardKPIs.attentionItems(from: items).count, 1)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: FAIL — `DashboardKPIs` undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/InspectionApp/Features/Dashboard/DashboardKPIs.swift`:
```swift
import Foundation

struct DashboardKPIs: Equatable {
    let today: Int
    let remaining: Int
    let needAttention: Int
    let inProgress: Int

    static let empty = DashboardKPIs(today: 0, remaining: 0, needAttention: 0, inProgress: 0)

    static func compute(from items: [VisitListItem], todayISODate: String) -> DashboardKPIs {
        let todays = items.filter { $0.visit.planningStatus == .published && isToday($0, todayISODate) }
        let remaining = todays.filter {
            $0.inspectionLifecycle != .approved && $0.visit.operationalState != .submitted
        }
        let attention = items.filter { $0.inspectionLifecycle == .returned }
        let inProgress = items.filter { $0.inspectionLifecycle == .in_progress }
        return DashboardKPIs(today: todays.count, remaining: remaining.count,
                             needAttention: attention.count, inProgress: inProgress.count)
    }

    static func attentionItems(from items: [VisitListItem]) -> [VisitListItem] {
        items.filter { $0.inspectionLifecycle == .returned }
    }

    private static func isToday(_ item: VisitListItem, _ today: String) -> Bool {
        if let d = item.visit.executionDate { return d == today }
        return isoDateString(item.visit.windowStart) == today
    }

    private static func isoDateString(_ date: Date) -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Riyadh") ?? .current
        let c = cal.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/InspectionApp/Features/Dashboard/DashboardKPIs.swift apps/ipad/InspectionAppTests/DashboardKPIsTests.swift
git commit -m "feat(ipad): add pure dashboard KPI computation"
```

---

### Task 5: Visit status filter (pure)

**Files:**
- Create: `apps/ipad/InspectionApp/Features/Visits/VisitFilter.swift`
- Test: `apps/ipad/InspectionAppTests/VisitFilterTests.swift`

**Interfaces:**
- Consumes: `VisitListItem`, enums.
- Produces:
  - `enum VisitFilter: String, CaseIterable { case all, today, inProgress, returned, submitted }` with `var title: String`.
  - `func apply(to items: [VisitListItem], todayISODate: String) -> [VisitListItem]`:
    - `.all` → all; `.today` → executionDate/window today; `.inProgress` → lifecycle `.in_progress`; `.returned` → lifecycle `.returned`; `.submitted` → operationalState `.submitted` OR lifecycle `.approved`.

- [ ] **Step 1: Write the failing test**

`apps/ipad/InspectionAppTests/VisitFilterTests.swift`:
```swift
import XCTest
@testable import InspectionApp

final class VisitFilterTests: XCTestCase {
    private func item(date: String?, lifecycle: InspectionLifecycle?, state: OperationalState = .new) -> VisitListItem {
        let v = Visit(id: UUID(), factoryId: UUID(), visitType: "t", executionMode: .physical,
                      planningStatus: .published, operationalState: state,
                      windowStart: Date(), windowEnd: Date(), executionDate: date, priority: nil)
        return VisitListItem(visit: v, factory: nil, inspectionLifecycle: lifecycle)
    }

    func test_filtersByCategory() {
        let today = "2026-07-25"
        let items = [
            item(date: today, lifecycle: nil),
            item(date: "2026-07-01", lifecycle: .in_progress),
            item(date: "2026-07-01", lifecycle: .returned),
            item(date: "2026-07-01", lifecycle: .approved, state: .submitted),
        ]
        XCTAssertEqual(VisitFilter.all.apply(to: items, todayISODate: today).count, 4)
        XCTAssertEqual(VisitFilter.today.apply(to: items, todayISODate: today).count, 1)
        XCTAssertEqual(VisitFilter.inProgress.apply(to: items, todayISODate: today).count, 1)
        XCTAssertEqual(VisitFilter.returned.apply(to: items, todayISODate: today).count, 1)
        XCTAssertEqual(VisitFilter.submitted.apply(to: items, todayISODate: today).count, 1)
    }

    func test_allCasesHaveTitles() {
        for f in VisitFilter.allCases { XCTAssertFalse(f.title.isEmpty) }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: FAIL — `VisitFilter` undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/InspectionApp/Features/Visits/VisitFilter.swift`:
```swift
import Foundation

enum VisitFilter: String, CaseIterable {
    case all, today, inProgress, returned, submitted

    var title: String {
        switch self {
        case .all: return "All"
        case .today: return "Today"
        case .inProgress: return "In progress"
        case .returned: return "Returned"
        case .submitted: return "Submitted"
        }
    }

    func apply(to items: [VisitListItem], todayISODate: String) -> [VisitListItem] {
        switch self {
        case .all: return items
        case .today: return items.filter { $0.visit.executionDate == todayISODate }
        case .inProgress: return items.filter { $0.inspectionLifecycle == .in_progress }
        case .returned: return items.filter { $0.inspectionLifecycle == .returned }
        case .submitted:
            return items.filter { $0.visit.operationalState == .submitted || $0.inspectionLifecycle == .approved }
        }
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/InspectionApp/Features/Visits/VisitFilter.swift apps/ipad/InspectionAppTests/VisitFilterTests.swift
git commit -m "feat(ipad): add pure visit status filter"
```

---

### Task 6: DashboardStore + VisitsStore + ProfileStore

**Files:**
- Create: `apps/ipad/InspectionApp/Features/Dashboard/DashboardStore.swift`
- Create: `apps/ipad/InspectionApp/Features/Visits/VisitsStore.swift`
- Create: `apps/ipad/InspectionApp/Data/Repositories/ProfileRepository.swift`
- Create: `apps/ipad/InspectionApp/Features/Profile/ProfileStore.swift`
- Create: `apps/ipad/InspectionAppTests/StubProfileRepository.swift`
- Test: `apps/ipad/InspectionAppTests/DashboardStoreTests.swift`, `apps/ipad/InspectionAppTests/VisitsStoreTests.swift`, `apps/ipad/InspectionAppTests/ProfileStoreTests.swift`

**Interfaces:**
- Consumes: `VisitRepository`, `StubVisitRepository`, `DashboardKPIs`, `VisitFilter`, `Profile` (Task 1 domain? Profile identity), `AuthSession` (Phase 0).
- Produces:
  - `struct InspectorIdentity: Equatable { let fullName: String; let email: String? }`.
  - `protocol ProfileRepository { func currentProfile() async throws -> InspectorIdentity }` + `SupabaseProfileRepository` (queries `from("profiles").select("full_name, email").eq("user_id", value: uid).single()` where `uid = client.auth.session.user.id`) + `StubProfileRepository`.
  - `@MainActor final class DashboardStore: ObservableObject`: `@Published private(set) var kpis: DashboardKPIs = .empty`, `@Published private(set) var attention: [VisitListItem] = []`, `@Published private(set) var isLoading = false`, `@Published var errorMessage: String?`, `init(repository:todayProvider:)` where `todayProvider: () -> String` defaults to Asia/Riyadh today, `func load() async`.
  - `@MainActor final class VisitsStore: ObservableObject`: `@Published private(set) var all: [VisitListItem] = []`, `@Published var filter: VisitFilter = .all`, `@Published private(set) var isLoading = false`, `@Published var errorMessage: String?`, `var visible: [VisitListItem]` (computed via filter), `func load() async`.
  - `@MainActor final class ProfileStore: ObservableObject`: `@Published private(set) var identity: InspectorIdentity?`, `func load() async`.

- [ ] **Step 1: Write the failing tests**

`apps/ipad/InspectionAppTests/StubProfileRepository.swift`:
```swift
import Foundation
@testable import InspectionApp

final class StubProfileRepository: ProfileRepository {
    var identity = InspectorIdentity(fullName: "Test Inspector", email: "t@mim.gov.sa")
    var error: Error?
    func currentProfile() async throws -> InspectorIdentity {
        if let error { throw error }; return identity
    }
}
```

`apps/ipad/InspectionAppTests/DashboardStoreTests.swift`:
```swift
import XCTest
@testable import InspectionApp

@MainActor
final class DashboardStoreTests: XCTestCase {
    func test_loadComputesKPIsAndAttention() async {
        let repo = StubVisitRepository()
        repo.items = [
            VisitRepositoryTests.sampleItem(type: "a", lifecycle: .returned, executionDate: "2026-07-25"),
            VisitRepositoryTests.sampleItem(type: "b", lifecycle: nil, executionDate: "2026-07-25"),
        ]
        let store = DashboardStore(repository: repo, todayProvider: { "2026-07-25" })
        await store.load()
        XCTAssertEqual(store.kpis.today, 2)
        XCTAssertEqual(store.kpis.needAttention, 1)
        XCTAssertEqual(store.attention.count, 1)
        XCTAssertNil(store.errorMessage)
    }

    func test_loadSetsErrorOnFailure() async {
        let repo = StubVisitRepository(); repo.error = NSError(domain: "x", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "boom"])
        let store = DashboardStore(repository: repo, todayProvider: { "2026-07-25" })
        await store.load()
        XCTAssertEqual(store.errorMessage, "boom")
    }
}
```

`apps/ipad/InspectionAppTests/VisitsStoreTests.swift`:
```swift
import XCTest
@testable import InspectionApp

@MainActor
final class VisitsStoreTests: XCTestCase {
    func test_visibleAppliesFilter() async {
        let repo = StubVisitRepository()
        repo.items = [
            VisitRepositoryTests.sampleItem(type: "a", lifecycle: .returned, executionDate: "2026-07-01"),
            VisitRepositoryTests.sampleItem(type: "b", lifecycle: nil, executionDate: "2026-07-25"),
        ]
        let store = VisitsStore(repository: repo, todayProvider: { "2026-07-25" })
        await store.load()
        XCTAssertEqual(store.all.count, 2)
        store.filter = .returned
        XCTAssertEqual(store.visible.count, 1)
        store.filter = .today
        XCTAssertEqual(store.visible.count, 1)
    }
}
```

`apps/ipad/InspectionAppTests/ProfileStoreTests.swift`:
```swift
import XCTest
@testable import InspectionApp

@MainActor
final class ProfileStoreTests: XCTestCase {
    func test_loadSetsIdentity() async {
        let repo = StubProfileRepository()
        let store = ProfileStore(repository: repo)
        await store.load()
        XCTAssertEqual(store.identity?.fullName, "Test Inspector")
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: FAIL — stores undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/InspectionApp/Data/Repositories/ProfileRepository.swift`:
```swift
import Foundation
import Supabase

struct InspectorIdentity: Equatable {
    let fullName: String
    let email: String?
}

protocol ProfileRepository {
    func currentProfile() async throws -> InspectorIdentity
}

final class SupabaseProfileRepository: ProfileRepository {
    private let client: SupabaseClient
    init(client: SupabaseClient = SupabaseClientProvider.shared) { self.client = client }

    private struct Row: Decodable {
        let fullName: String
        let email: String?
        enum CodingKeys: String, CodingKey { case fullName = "full_name", email }
    }

    func currentProfile() async throws -> InspectorIdentity {
        let uid = try await client.auth.session.user.id
        let response = try await client.from("profiles")
            .select("full_name, email")
            .eq("user_id", value: uid)
            .single()
            .execute()
        let row = try JSONDecoder().decode(Row.self, from: response.data)
        return InspectorIdentity(fullName: row.fullName, email: row.email)
    }
}
```

`apps/ipad/InspectionApp/Features/Dashboard/DashboardStore.swift`:
```swift
import Foundation

@MainActor
final class DashboardStore: ObservableObject {
    @Published private(set) var kpis: DashboardKPIs = .empty
    @Published private(set) var attention: [VisitListItem] = []
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let repository: VisitRepository
    private let todayProvider: () -> String

    init(repository: VisitRepository = SupabaseVisitRepository(),
         todayProvider: @escaping () -> String = DashboardStore.riyadhToday) {
        self.repository = repository
        self.todayProvider = todayProvider
    }

    func load() async {
        isLoading = true; errorMessage = nil
        defer { isLoading = false }
        do {
            let items = try await repository.fetchAssignedVisits()
            let today = todayProvider()
            kpis = DashboardKPIs.compute(from: items, todayISODate: today)
            attention = DashboardKPIs.attentionItems(from: items)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    static func riyadhToday() -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Riyadh") ?? .current
        let c = cal.dateComponents([.year, .month, .day], from: Date())
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }
}
```

`apps/ipad/InspectionApp/Features/Visits/VisitsStore.swift`:
```swift
import Foundation

@MainActor
final class VisitsStore: ObservableObject {
    @Published private(set) var all: [VisitListItem] = []
    @Published var filter: VisitFilter = .all
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let repository: VisitRepository
    private let todayProvider: () -> String

    init(repository: VisitRepository = SupabaseVisitRepository(),
         todayProvider: @escaping () -> String = DashboardStore.riyadhToday) {
        self.repository = repository
        self.todayProvider = todayProvider
    }

    var visible: [VisitListItem] { filter.apply(to: all, todayISODate: todayProvider()) }

    func load() async {
        isLoading = true; errorMessage = nil
        defer { isLoading = false }
        do { all = try await repository.fetchAssignedVisits() }
        catch { errorMessage = error.localizedDescription }
    }
}
```

`apps/ipad/InspectionApp/Features/Profile/ProfileStore.swift`:
```swift
import Foundation

@MainActor
final class ProfileStore: ObservableObject {
    @Published private(set) var identity: InspectorIdentity?
    @Published var errorMessage: String?

    private let repository: ProfileRepository
    init(repository: ProfileRepository = SupabaseProfileRepository()) { self.repository = repository }

    func load() async {
        do { identity = try await repository.currentProfile() }
        catch { errorMessage = error.localizedDescription }
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: PASS (all store tests green).

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/InspectionApp/Features apps/ipad/InspectionApp/Data/Repositories/ProfileRepository.swift apps/ipad/InspectionAppTests/StubProfileRepository.swift apps/ipad/InspectionAppTests/DashboardStoreTests.swift apps/ipad/InspectionAppTests/VisitsStoreTests.swift apps/ipad/InspectionAppTests/ProfileStoreTests.swift
git commit -m "feat(ipad): add Dashboard/Visits/Profile stores with repositories"
```

---

### Task 7: Visit card + status mapping component

**Files:**
- Create: `apps/ipad/InspectionApp/Features/Visits/VisitStatusPresentation.swift`
- Create: `apps/ipad/InspectionApp/Features/Visits/VisitCard.swift`
- Test: `apps/ipad/InspectionAppTests/VisitStatusPresentationTests.swift`

**Interfaces:**
- Consumes: `VisitListItem`, `LozengeTone`, `LozengeDomain`, tokens, `SaqeelCard`.
- Produces:
  - `enum VisitStatusPresentation` with `static func planningTone(_ s: PlanningStatus) -> LozengeTone` (published→success, returned→warning, cancelled/expired→critical, draft→neutral) and `static func lifecycleLabel(_ l: InspectionLifecycle?) -> String` ("Not started" when nil).
  - `struct VisitCard: View` init `(item: VisitListItem, onOpen: () -> Void)` — renders factory name + code, `visitType · executionMode`, planning-status lozenge (`domain: .plan`) + inspection lifecycle lozenge (`domain: .review`), window dates, and an "Open" `SaqeelButton`. Uses `SaqeelCard`.

- [ ] **Step 1: Write the failing test**

`apps/ipad/InspectionAppTests/VisitStatusPresentationTests.swift`:
```swift
import XCTest
import Components
@testable import InspectionApp

final class VisitStatusPresentationTests: XCTestCase {
    func test_planningToneMapping() {
        XCTAssertEqual(VisitStatusPresentation.planningTone(.published), .success)
        XCTAssertEqual(VisitStatusPresentation.planningTone(.returned), .warning)
        XCTAssertEqual(VisitStatusPresentation.planningTone(.cancelled), .critical)
        XCTAssertEqual(VisitStatusPresentation.planningTone(.expired), .critical)
        XCTAssertEqual(VisitStatusPresentation.planningTone(.draft), .neutral)
    }

    func test_lifecycleLabelNilIsNotStarted() {
        XCTAssertEqual(VisitStatusPresentation.lifecycleLabel(nil), "Not started")
        XCTAssertEqual(VisitStatusPresentation.lifecycleLabel(.in_progress), "In progress")
        XCTAssertEqual(VisitStatusPresentation.lifecycleLabel(.returned), "Returned")
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: FAIL — `VisitStatusPresentation` undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/InspectionApp/Features/Visits/VisitStatusPresentation.swift`:
```swift
import Foundation
import Components

enum VisitStatusPresentation {
    static func planningTone(_ s: PlanningStatus) -> LozengeTone {
        switch s {
        case .published: return .success
        case .returned:  return .warning
        case .cancelled, .expired: return .critical
        case .draft:     return .neutral
        }
    }

    static func lifecycleLabel(_ l: InspectionLifecycle?) -> String {
        switch l {
        case .none:         return "Not started"
        case .new:          return "New"
        case .in_progress:  return "In progress"
        case .returned:     return "Returned"
        case .approved:     return "Approved"
        case .rejected:     return "Rejected"
        case .cancelled:    return "Cancelled"
        }
    }

    static func lifecycleTone(_ l: InspectionLifecycle?) -> LozengeTone {
        switch l {
        case .approved: return .success
        case .returned, .rejected: return .critical
        case .in_progress: return .info
        default: return .neutral
        }
    }
}
```

`apps/ipad/InspectionApp/Features/Visits/VisitCard.swift`:
```swift
import SwiftUI
import DesignSystem
import Components

struct VisitCard: View {
    let item: VisitListItem
    let onOpen: () -> Void
    @EnvironmentObject private var theme: SaqeelTheme

    private static let dateFmt: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "d MMM"; return f
    }()

    var body: some View {
        SaqeelCard {
            VStack(alignment: .leading, spacing: SaqeelSpacing.sm) {
                Text(item.factory?.name ?? "Unknown factory")
                    .font(SaqeelTypography.subheading)
                    .foregroundColor(theme.colors.text)
                if let code = item.factory?.factoryCode {
                    Text(code).font(SaqeelTypography.caption).foregroundColor(theme.colors.textSecondary)
                }
                Text("\(item.visit.visitType) · \(item.visit.executionMode.rawValue)")
                    .font(SaqeelTypography.caption).foregroundColor(theme.colors.textSecondary)
                HStack(spacing: SaqeelSpacing.xs) {
                    StatusLozenge(item.visit.planningStatus.rawValue,
                                  tone: VisitStatusPresentation.planningTone(item.visit.planningStatus),
                                  domain: .plan)
                    StatusLozenge(VisitStatusPresentation.lifecycleLabel(item.inspectionLifecycle),
                                  tone: VisitStatusPresentation.lifecycleTone(item.inspectionLifecycle),
                                  domain: .review)
                }
                Text("\(Self.dateFmt.string(from: item.visit.windowStart)) – \(Self.dateFmt.string(from: item.visit.windowEnd))")
                    .font(SaqeelTypography.caption).foregroundColor(theme.colors.textSecondary)
                SaqeelButton("Open", style: .secondary, action: onOpen)
            }
        }
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/InspectionApp/Features/Visits/VisitStatusPresentation.swift apps/ipad/InspectionApp/Features/Visits/VisitCard.swift apps/ipad/InspectionAppTests/VisitStatusPresentationTests.swift
git commit -m "feat(ipad): add visit status presentation + VisitCard"
```

---

### Task 8: Dashboard, Visits, Profile views + wire into shell

**Files:**
- Create: `apps/ipad/InspectionApp/Features/Dashboard/DashboardView.swift`
- Create: `apps/ipad/InspectionApp/Features/Visits/VisitsView.swift`
- Create: `apps/ipad/InspectionApp/Features/Profile/ProfileView.swift`
- Modify: `apps/ipad/InspectionApp/Features/Shell/RootShellView.swift`
- Test: `apps/ipad/InspectionAppTests/ShellContentTests.swift`

**Interfaces:**
- Consumes: `DashboardStore`, `VisitsStore`, `ProfileStore`, `AuthSession` (Phase 0 — for sign out), `InspectionTab`, `InspectionHeader`, `SaqeelCard`, `VisitCard`, tokens.
- Produces:
  - `struct DashboardView: View` — owns `@StateObject DashboardStore`, shows a KPI grid (4 `SaqeelCard`s with `SaqeelTypography.metric` values + labels) and an attention section listing `VisitCard`s; `.task { await store.load() }`; error + empty states.
  - `struct VisitsView: View` — owns `@StateObject VisitsStore`, a segmented `VisitFilter` picker, a scrolling list of `VisitCard`s from `store.visible`; loading/empty/error states; `.task { await store.load() }`.
  - `struct ProfileView: View` — owns `@StateObject ProfileStore`, shows identity + a "Sign out" `SaqeelButton` (`.danger`) calling `session.signOut()`; `.task { await store.load() }`.
  - `RootShellView`: replaces placeholder tab bodies — dashboard→`DashboardView`, visits→`VisitsView`, virtual→placeholder text (Phase 5), profile→`ProfileView`. Adds a static helper `static func usesLiveContent(for tab: InspectionTab) -> Bool` returning true for dashboard/visits/profile, false for virtual — so the test can assert wiring without rendering.

- [ ] **Step 1: Write the failing test**

`apps/ipad/InspectionAppTests/ShellContentTests.swift`:
```swift
import XCTest
import Components
@testable import InspectionApp

final class ShellContentTests: XCTestCase {
    func test_liveContentTabsWired() {
        XCTAssertTrue(RootShellView.usesLiveContent(for: .dashboard))
        XCTAssertTrue(RootShellView.usesLiveContent(for: .visits))
        XCTAssertTrue(RootShellView.usesLiveContent(for: .profile))
        XCTAssertFalse(RootShellView.usesLiveContent(for: .virtual)) // Phase 5
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: FAIL — `usesLiveContent` undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/InspectionApp/Features/Dashboard/DashboardView.swift`:
```swift
import SwiftUI
import DesignSystem
import Components

struct DashboardView: View {
    @StateObject private var store = DashboardStore()
    @EnvironmentObject private var theme: SaqeelTheme

    private var kpiCells: [(String, Int)] {
        [("Today", store.kpis.today), ("Remaining", store.kpis.remaining),
         ("Need attention", store.kpis.needAttention), ("In progress", store.kpis.inProgress)]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: SaqeelSpacing.lg) {
                if let err = store.errorMessage {
                    Text(err).font(SaqeelTypography.caption).foregroundColor(theme.colors.critical)
                }
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 160), spacing: SaqeelSpacing.md)],
                          spacing: SaqeelSpacing.md) {
                    ForEach(kpiCells, id: \.0) { cell in
                        SaqeelCard {
                            Text("\(cell.1)").font(SaqeelTypography.metric).foregroundColor(theme.colors.primary)
                            Text(cell.0).font(SaqeelTypography.label).foregroundColor(theme.colors.textSecondary)
                        }
                    }
                }
                Text("Needs attention").font(SaqeelTypography.heading).foregroundColor(theme.colors.text)
                if store.attention.isEmpty {
                    Text("Nothing needs attention.").font(SaqeelTypography.caption)
                        .foregroundColor(theme.colors.textSecondary)
                } else {
                    ForEach(store.attention) { item in VisitCard(item: item, onOpen: {}) }
                }
            }
            .padding(SaqeelSpacing.lg)
        }
        .background(theme.colors.canvas)
        .task { await store.load() }
    }
}
```

`apps/ipad/InspectionApp/Features/Visits/VisitsView.swift`:
```swift
import SwiftUI
import DesignSystem
import Components

struct VisitsView: View {
    @StateObject private var store = VisitsStore()
    @EnvironmentObject private var theme: SaqeelTheme

    var body: some View {
        VStack(spacing: 0) {
            Picker("Filter", selection: $store.filter) {
                ForEach(VisitFilter.allCases, id: \.self) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            .padding(SaqeelSpacing.md)

            if store.isLoading {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let err = store.errorMessage {
                Text(err).font(SaqeelTypography.caption).foregroundColor(theme.colors.critical)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if store.visible.isEmpty {
                Text("No visits.").font(SaqeelTypography.body).foregroundColor(theme.colors.textSecondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: SaqeelSpacing.md) {
                        ForEach(store.visible) { item in VisitCard(item: item, onOpen: {}) }
                    }
                    .padding(SaqeelSpacing.lg)
                }
            }
        }
        .background(theme.colors.canvas)
        .task { await store.load() }
    }
}
```

`apps/ipad/InspectionApp/Features/Profile/ProfileView.swift`:
```swift
import SwiftUI
import DesignSystem
import Components

struct ProfileView: View {
    @StateObject private var store = ProfileStore()
    @EnvironmentObject private var session: AuthSession
    @EnvironmentObject private var theme: SaqeelTheme

    var body: some View {
        VStack(alignment: .leading, spacing: SaqeelSpacing.lg) {
            SaqeelCard {
                Text(store.identity?.fullName ?? "—")
                    .font(SaqeelTypography.subheading).foregroundColor(theme.colors.text)
                if let email = store.identity?.email {
                    Text(email).font(SaqeelTypography.caption).foregroundColor(theme.colors.textSecondary)
                }
            }
            SaqeelButton("Sign out", style: .danger) { Task { await session.signOut() } }
            Spacer()
        }
        .padding(SaqeelSpacing.lg)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(theme.colors.canvas)
        .task { await store.load() }
    }
}
```

`apps/ipad/InspectionApp/Features/Shell/RootShellView.swift` (replace the `tabContent` body and add the helper — keep `static let tabs` and the `TabView`):
```swift
import SwiftUI
import DesignSystem
import Components

struct RootShellView: View {
    static let tabs = InspectionTab.allCases

    static func usesLiveContent(for tab: InspectionTab) -> Bool {
        switch tab {
        case .dashboard, .visits, .profile: return true
        case .virtual: return false
        }
    }

    @State private var selection: InspectionTab = .dashboard
    @EnvironmentObject private var theme: SaqeelTheme

    var body: some View {
        TabView(selection: $selection) {
            ForEach(Self.tabs, id: \.self) { tab in
                NavigationStack {
                    VStack(spacing: 0) {
                        InspectionHeader(title: tab.title, sync: .synced)
                        tabContent(tab)
                    }
                    .background(theme.colors.canvas)
                }
                .tabItem { Label(tab.title, systemImage: tab.systemImage) }
                .tag(tab)
            }
        }
        .tint(theme.colors.primary)
    }

    @ViewBuilder
    private func tabContent(_ tab: InspectionTab) -> some View {
        switch tab {
        case .dashboard: DashboardView()
        case .visits:    VisitsView()
        case .profile:   ProfileView()
        case .virtual:
            Text("Virtual — coming in a later phase")
                .font(SaqeelTypography.body).foregroundColor(theme.colors.textSecondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}
```

- [ ] **Step 4: Run test + build to verify**

Run: `cd apps/ipad && xcodegen generate && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO`
Expected: BUILD SUCCEEDED and `ShellContentTests` PASS. Manual: launch, sign in with a real inspector account → Dashboard shows KPI cards; Visits tab lists assigned visits; Profile shows name + Sign out returns to Login.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/InspectionApp/Features apps/ipad/InspectionAppTests/ShellContentTests.swift
git commit -m "feat(ipad): wire live Dashboard, Visits, and Profile into the shell"
```

---

## Self-Review

**Spec coverage (design spec §7 Dashboard + Visits slice):**
- Dashboard KPIs (today / remaining / need-attention / in-progress) → Task 4 + 8. ✅ (Heavier KPIs — checklist compliance, approval outcomes, personal trends — deferred; they need `checklist_responses`/`reviews` aggregation, noted below.)
- Attention rail (returned) → Task 4 + 8. ✅
- Visits list + status filter + status lozenges → Tasks 5, 7, 8. ✅
- Real Supabase read, RLS-scoped → Tasks 2, 3. ✅
- Profile (identity + sign out) → Task 6, 8. ✅ (light; full Profile is Phase 5.)
- Wired into native tab shell → Task 8. ✅

**Placeholder scan:** No TBD/"handle errors" — every step has full code. Error/empty/loading states are concrete.

**Type consistency:** `VisitListItem`, `VisitRow.selectClause`, `DashboardKPIs.compute(from:todayISODate:)`, `VisitFilter.apply(to:todayISODate:)`, `InspectorIdentity`, `RootShellView.usesLiveContent(for:)` used identically across tasks. `DashboardStore.riyadhToday` reused by `VisitsStore`. Enums match schema verbatim.

**Deferred (documented, not silent):**
- Server-side filtering/pagination of visits (Phase 1 fetches all RLS-visible + filters client-side).
- Compliance/approval-outcome/trend KPIs (need `checklist_responses` + `reviews`) — add when those tables are modeled (Phase 2/3).
- Opening a visit (`onOpen`) is a no-op placeholder — navigation into Startup/Workspace lands in Phase 2/4.
- Real IBM Plex fonts still deferred (see `apps/ipad/PHASE1-FOLLOWUPS.md`).

---

## Notes for executor

- Supabase Swift `.execute()` returns a response whose `.data` is `Data`; decode with `VisitRow.decoder()` (Task 2) rather than the client's implicit `.value` so the custom date strategy applies. For `profiles` the plain `JSONDecoder` is fine (no dates selected).
- If `client.auth.session.user.id` API differs slightly in the resolved SDK version, adapt minimally; the value needed is the current user UUID.
- Manual verification needs a real inspector login (creds live in the gitignored `Secrets.local.xcconfig`). Unit tests never hit the network (stubs only).
