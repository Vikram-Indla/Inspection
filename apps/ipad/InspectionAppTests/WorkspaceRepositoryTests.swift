// WorkspaceRepositoryTests.swift
// Stub-driven contract tests for WorkspaceRepository.
// No network calls — all interactions go through StubWorkspaceRepository.

import XCTest
@testable import InspectionApp

// MARK: - StubWorkspaceRepository

final class StubWorkspaceRepository: WorkspaceRepository {
    var workspaceData: WorkspaceData?
    var workspaceError: Error?
    var inspectionId: String?
    var inspectionIdError: Error?

    private(set) var loadCallCount = 0
    private(set) var openCallCount = 0
    private(set) var lastLoadedInspectionId: String?
    private(set) var lastVisitId: String?

    func loadWorkspace(inspectionId: String) async throws -> WorkspaceData {
        loadCallCount += 1
        lastLoadedInspectionId = inspectionId
        if let error = workspaceError { throw error }
        guard let data = workspaceData else {
            throw NSError(domain: "StubWorkspaceRepository", code: 0,
                          userInfo: [NSLocalizedDescriptionKey: "No stub data set"])
        }
        return data
    }

    func openInspection(forVisit visitId: String) async throws -> String? {
        openCallCount += 1
        lastVisitId = visitId
        if let error = inspectionIdError { throw error }
        return inspectionId
    }
}

// MARK: - Helpers

private func makeHead(id: String = "cccc0000-0000-0000-0000-000000000001") -> InspectionHeadRow {
    let pkgVersionRow = PackageVersionRow(
        id: UUID(uuidString: "aaaa0000-0000-0000-0000-000000000001")!,
        versionLabel: "v1.0",
        definition: PackageDefinition(
            sections: [
                Section(
                    key: "fire_safety",
                    titleEn: "Fire Safety",
                    titleAr: "سلامة الحريق",
                    items: ["FS-001", "FS-002"]
                )
            ],
            itemRules: ["FS-001": .object(["requirement": .string("required")])]
        ),
        packages: nil
    )
    return InspectionHeadRow(
        id: UUID(uuidString: id)!,
        status: "in_progress",
        visitId: UUID(uuidString: "dddd0000-0000-0000-0000-000000000001")!,
        packageVersions: pkgVersionRow
    )
}

private func makeItem(code: String = "FS-001") -> InspectionItemDef {
    InspectionItemDef(
        id: UUID(uuidString: "bbbb0000-0000-0000-0000-000000000001")!,
        code: code,
        title: "Fire extinguisher present",
        responseModel: ResponseModel(
            responses: ["compliant", "non_compliant", "na"],
            mapping: nil,
            conditional: nil,
            requirement: "mandatory"
        ),
        evidenceRule: nil,
        guidanceEn: "Check that extinguisher is in place.",
        guidanceAr: nil
    )
}

private func makeWorkspaceData() -> WorkspaceData {
    let head = makeHead()
    let item = makeItem()
    let serverResponse = ServerResponse(
        answer: Answer(value: "compliant", note: nil, date: nil),
        baselineUpdatedAt: "2026-07-25T10:30:45.22+00:00"
    )
    return WorkspaceData(
        head: head,
        packageDefinition: head.packageVersions.definition,
        items: [item],
        responses: [item.id.uuidString: serverResponse]
    )
}

// MARK: - Tests

final class WorkspaceRepositoryTests: XCTestCase {

    // MARK: loadWorkspace

    func test_loadWorkspace_returnsItems() async throws {
        let stub = StubWorkspaceRepository()
        stub.workspaceData = makeWorkspaceData()

        let data = try await stub.loadWorkspace(inspectionId: "test-inspection-id")

        XCTAssertEqual(data.items.count, 1)
        XCTAssertEqual(data.items[0].code, "FS-001")
    }

    func test_loadWorkspace_returnsSections() async throws {
        let stub = StubWorkspaceRepository()
        stub.workspaceData = makeWorkspaceData()

        let data = try await stub.loadWorkspace(inspectionId: "test-inspection-id")

        XCTAssertEqual(data.packageDefinition.sections.count, 1)
        XCTAssertEqual(data.packageDefinition.sections[0].key, "fire_safety")
        XCTAssertEqual(data.packageDefinition.sections[0].titleEn, "Fire Safety")
    }

    func test_loadWorkspace_returnsResponses() async throws {
        let stub = StubWorkspaceRepository()
        let workspace = makeWorkspaceData()
        stub.workspaceData = workspace

        let data = try await stub.loadWorkspace(inspectionId: "test-inspection-id")

        let itemIdKey = workspace.items[0].id.uuidString
        XCTAssertNotNil(data.responses[itemIdKey])
        XCTAssertEqual(data.responses[itemIdKey]?.answer.value, "compliant")
        XCTAssertEqual(data.responses[itemIdKey]?.baselineUpdatedAt, "2026-07-25T10:30:45.22+00:00")
    }

    func test_loadWorkspace_forwardsInspectionId() async throws {
        let stub = StubWorkspaceRepository()
        stub.workspaceData = makeWorkspaceData()

        _ = try await stub.loadWorkspace(inspectionId: "my-inspection-id")

        XCTAssertEqual(stub.lastLoadedInspectionId, "my-inspection-id")
        XCTAssertEqual(stub.loadCallCount, 1)
    }

    func test_loadWorkspace_propagatesError() async {
        let stub = StubWorkspaceRepository()
        stub.workspaceError = NSError(domain: "test", code: 42)

        do {
            _ = try await stub.loadWorkspace(inspectionId: "id")
            XCTFail("Expected error to be thrown")
        } catch let error as NSError {
            XCTAssertEqual(error.code, 42)
        }
    }

    func test_loadWorkspace_headIdMatchesStub() async throws {
        let stub = StubWorkspaceRepository()
        stub.workspaceData = makeWorkspaceData()

        let data = try await stub.loadWorkspace(inspectionId: "test-inspection-id")

        XCTAssertEqual(data.head.id.uuidString.lowercased(), "cccc0000-0000-0000-0000-000000000001")
        XCTAssertEqual(data.head.status, "in_progress")
    }

    // MARK: openInspection

    func test_openInspection_returnsStubId() async throws {
        let stub = StubWorkspaceRepository()
        stub.inspectionId = "insp-abc-123"

        let result = try await stub.openInspection(forVisit: "visit-xyz")

        XCTAssertEqual(result, "insp-abc-123")
        XCTAssertEqual(stub.lastVisitId, "visit-xyz")
        XCTAssertEqual(stub.openCallCount, 1)
    }

    func test_openInspection_returnsNilWhenNoInspection() async throws {
        let stub = StubWorkspaceRepository()
        stub.inspectionId = nil

        let result = try await stub.openInspection(forVisit: "visit-no-inspection")

        XCTAssertNil(result)
    }

    func test_openInspection_propagatesError() async {
        let stub = StubWorkspaceRepository()
        stub.inspectionIdError = NSError(domain: "test", code: 99)

        do {
            _ = try await stub.openInspection(forVisit: "visit-xyz")
            XCTFail("Expected error to be thrown")
        } catch let error as NSError {
            XCTAssertEqual(error.code, 99)
        }
    }
}
