// WorkspaceStoreTests.swift
// TDD tests for WorkspaceStore — Task 7.
// Uses StubWorkspaceRepository, in-memory OfflineStore, and a fake engine factory.

import XCTest
@testable import InspectionApp

// MARK: - StubSyncEngine

/// A minimal sync-engine stub that records `process()` calls and returns a fixed state.
final class StubSyncEngine {
    var state: SyncState = .synced
    private(set) var processCallCount = 0

    func process() async -> SyncState {
        processCallCount += 1
        return state
    }
}

// MARK: - Helpers

private func makeItem(
    id: UUID = UUID(uuidString: "bbbb0000-0000-0000-0000-000000000001")!,
    code: String = "FS-001",
    requirement: String = "required"
) -> InspectionItemDef {
    InspectionItemDef(
        id: id,
        code: code,
        title: "Fire extinguisher present",
        responseModel: ResponseModel(
            responses: ["compliant", "non_compliant", "na"],
            mapping: nil,
            conditional: nil,
            requirement: requirement
        ),
        evidenceRule: nil,
        guidanceEn: "Check that extinguisher is in place.",
        guidanceAr: nil
    )
}

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
                    items: ["FS-001"]
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

private func makeWorkspaceData(
    item: InspectionItemDef? = nil,
    serverAnswerValue: String? = nil
) -> WorkspaceData {
    let resolvedItem = item ?? makeItem()
    let head = makeHead()
    var responses: [String: ServerResponse] = [:]
    if let v = serverAnswerValue {
        responses[resolvedItem.id.uuidString] = ServerResponse(
            answer: Answer(value: v, note: nil, date: nil),
            baselineUpdatedAt: "2026-07-25T10:30:45.22+00:00"
        )
    }
    return WorkspaceData(
        head: head,
        packageDefinition: head.packageVersions.definition,
        items: [resolvedItem],
        responses: responses
    )
}

// MARK: - WorkspaceStoreTests

@MainActor
final class WorkspaceStoreTests: XCTestCase {

    // MARK: - Helpers

    /// Builds a WorkspaceStore with stub repo, in-memory store, and a fake engine.
    private func makeStore(
        workspaceData: WorkspaceData,
        engineStub: StubSyncEngine = StubSyncEngine()
    ) throws -> (store: WorkspaceStore, offlineStore: OfflineStore, engine: StubSyncEngine) {
        let repo = StubWorkspaceRepository()
        repo.workspaceData = workspaceData

        let offlineStore = try OfflineStore.inMemory()

        let factory: WorkspaceStore.EngineFactory = { _, _, _ in
            { await engineStub.process() }
        }

        let ws = WorkspaceStore(
            inspectionId: "cccc0000-0000-0000-0000-000000000001",
            repository: repo,
            store: offlineStore,
            engineFactory: factory
        )
        return (ws, offlineStore, engineStub)
    }

    // MARK: - Test: load() populates sections, answers, progress

    func test_load_populatesSections() async throws {
        let item = makeItem(requirement: "required")
        let data = makeWorkspaceData(item: item, serverAnswerValue: nil)
        let (ws, _, _) = try makeStore(workspaceData: data)

        await ws.load()

        XCTAssertFalse(ws.isLoading)
        XCTAssertNil(ws.errorMessage)
        XCTAssertEqual(ws.sections.count, 1)
        XCTAssertEqual(ws.sections[0].id, "fire_safety")
        XCTAssertEqual(ws.sections[0].title, "Fire Safety")
        XCTAssertEqual(ws.sections[0].items.count, 1)
        XCTAssertEqual(ws.sections[0].items[0].code, "FS-001")
    }

    func test_load_hydratesAnswersFromServerResponses() async throws {
        let item = makeItem()
        let data = makeWorkspaceData(item: item, serverAnswerValue: "compliant")
        let (ws, _, _) = try makeStore(workspaceData: data)

        await ws.load()

        let key = item.id.uuidString
        XCTAssertEqual(ws.answers[key]?.value, "compliant")
    }

    func test_load_overlaysGRDBDrafts() async throws {
        let item = makeItem()
        let inspectionId = "cccc0000-0000-0000-0000-000000000001"
        let data = makeWorkspaceData(item: item, serverAnswerValue: "compliant")

        let offlineStore = try OfflineStore.inMemory()
        // Pre-save a draft that should override the server value
        try offlineStore.saveDraft(
            inspectionId: inspectionId,
            itemId: item.id.uuidString,
            Answer(value: "non_compliant", note: "draft override", date: nil)
        )

        let repo = StubWorkspaceRepository()
        repo.workspaceData = data
        let engineStub = StubSyncEngine()
        let factory: WorkspaceStore.EngineFactory = { _, _, _ in
            { await engineStub.process() }
        }
        let ws = WorkspaceStore(
            inspectionId: inspectionId,
            repository: repo,
            store: offlineStore,
            engineFactory: factory
        )

        await ws.load()

        let key = item.id.uuidString
        // Draft should win over server response
        XCTAssertEqual(ws.answers[key]?.value, "non_compliant")
        XCTAssertEqual(ws.answers[key]?.note, "draft override")
    }

    func test_load_computesProgress() async throws {
        let item = makeItem()
        let data = makeWorkspaceData(item: item, serverAnswerValue: "compliant")
        let (ws, _, _) = try makeStore(workspaceData: data)

        await ws.load()

        XCTAssertEqual(ws.progress.answered, 1)
        XCTAssertEqual(ws.progress.total, 1)
    }

    func test_load_progressZeroWhenNoAnswers() async throws {
        let item = makeItem()
        let data = makeWorkspaceData(item: item, serverAnswerValue: nil)
        let (ws, _, _) = try makeStore(workspaceData: data)

        await ws.load()

        XCTAssertEqual(ws.progress.answered, 0)
        XCTAssertEqual(ws.progress.total, 1)
    }

    func test_load_setsErrorMessageOnFailure() async throws {
        let repo = StubWorkspaceRepository()
        repo.workspaceError = NSError(domain: "test", code: 42, userInfo: [NSLocalizedDescriptionKey: "network fail"])
        let offlineStore = try OfflineStore.inMemory()
        let engineStub = StubSyncEngine()
        let factory: WorkspaceStore.EngineFactory = { _, _, _ in
            { await engineStub.process() }
        }
        let ws = WorkspaceStore(
            inspectionId: "cccc0000-0000-0000-0000-000000000001",
            repository: repo,
            store: offlineStore,
            engineFactory: factory
        )

        await ws.load()

        XCTAssertNotNil(ws.errorMessage)
        XCTAssertFalse(ws.isLoading)
    }

    // MARK: - Test: answer() updates answers, saves draft, enqueues response op, updates progress

    func test_answer_updatesAnswersDictionary() async throws {
        let item = makeItem()
        let data = makeWorkspaceData(item: item, serverAnswerValue: nil)
        let (ws, _, _) = try makeStore(workspaceData: data)
        await ws.load()

        await ws.answer(itemId: item.id.uuidString, patch: Answer(value: "compliant", note: nil, date: nil))

        XCTAssertEqual(ws.answers[item.id.uuidString]?.value, "compliant")
    }

    func test_answer_savesDraftToOfflineStore() async throws {
        let item = makeItem()
        let inspectionId = "cccc0000-0000-0000-0000-000000000001"
        let data = makeWorkspaceData(item: item, serverAnswerValue: nil)
        let (ws, offlineStore, _) = try makeStore(workspaceData: data)
        await ws.load()

        await ws.answer(itemId: item.id.uuidString, patch: Answer(value: "compliant", note: nil, date: nil))

        let draft = offlineStore.draft(inspectionId: inspectionId, itemId: item.id.uuidString)
        XCTAssertEqual(draft?.value, "compliant")
    }

    func test_answer_enqueuedResponseOpIntoOutbox() async throws {
        let item = makeItem()
        let data = makeWorkspaceData(item: item, serverAnswerValue: nil)
        let (ws, offlineStore, _) = try makeStore(workspaceData: data)
        await ws.load()

        await ws.answer(itemId: item.id.uuidString, patch: Answer(value: "compliant", note: nil, date: nil))

        XCTAssertEqual(offlineStore.outboxCount(), 1)
        let ops = offlineStore.peekAll()
        guard case .response(let responseOp) = ops.first?.op else {
            XCTFail("Expected a .response op in outbox")
            return
        }
        XCTAssertEqual(responseOp.itemId, item.id.uuidString)
        XCTAssertEqual(responseOp.response.value, "compliant")
        XCTAssertEqual(responseOp.inspectionId, "cccc0000-0000-0000-0000-000000000001")
    }

    func test_answer_updatesProgress() async throws {
        let item = makeItem()
        let data = makeWorkspaceData(item: item, serverAnswerValue: nil)
        let (ws, _, _) = try makeStore(workspaceData: data)
        await ws.load()

        XCTAssertEqual(ws.progress.answered, 0)

        await ws.answer(itemId: item.id.uuidString, patch: Answer(value: "compliant", note: nil, date: nil))

        XCTAssertEqual(ws.progress.answered, 1)
        XCTAssertEqual(ws.progress.total, 1)
    }

    func test_answer_doesNotEnqueueWhenValueIsNil() async throws {
        let item = makeItem()
        let data = makeWorkspaceData(item: item, serverAnswerValue: nil)
        let (ws, offlineStore, _) = try makeStore(workspaceData: data)
        await ws.load()

        // Patch with nil value (e.g. note-only update without a choice)
        await ws.answer(itemId: item.id.uuidString, patch: Answer(value: nil, note: "just a note", date: nil))

        XCTAssertEqual(offlineStore.outboxCount(), 0)
    }

    func test_answer_carriesBaselineUpdatedAtFromServerResponse() async throws {
        let item = makeItem()
        let data = makeWorkspaceData(item: item, serverAnswerValue: "compliant")
        let (ws, offlineStore, _) = try makeStore(workspaceData: data)
        await ws.load()

        // Answer again with a new value — baseline should match the server's updatedAt
        await ws.answer(itemId: item.id.uuidString, patch: Answer(value: "non_compliant", note: nil, date: nil))

        let ops = offlineStore.peekAll()
        guard case .response(let responseOp) = ops.first?.op else {
            XCTFail("Expected a .response op in outbox")
            return
        }
        XCTAssertEqual(responseOp.baselineUpdatedAt, "2026-07-25T10:30:45.22+00:00")
    }

    func test_answer_callsSyncEngine() async throws {
        let item = makeItem()
        let data = makeWorkspaceData(item: item, serverAnswerValue: nil)
        let engineStub = StubSyncEngine()
        let (ws, _, _) = try makeStore(workspaceData: data, engineStub: engineStub)
        await ws.load()

        await ws.answer(itemId: item.id.uuidString, patch: Answer(value: "compliant", note: nil, date: nil))

        XCTAssertGreaterThan(engineStub.processCallCount, 0)
    }

    // MARK: - Test: canSubmit

    func test_canSubmit_trueWhenAllRequiredItemsAnswered() async throws {
        let item = makeItem(requirement: "required")
        let data = makeWorkspaceData(item: item, serverAnswerValue: "compliant")
        let (ws, _, _) = try makeStore(workspaceData: data)
        await ws.load()

        XCTAssertTrue(ws.canSubmit)
    }

    func test_canSubmit_falseWhenRequiredItemNotAnswered() async throws {
        let item = makeItem(requirement: "required")
        let data = makeWorkspaceData(item: item, serverAnswerValue: nil)
        let (ws, _, _) = try makeStore(workspaceData: data)
        await ws.load()

        XCTAssertFalse(ws.canSubmit)
    }

    func test_canSubmit_trueWhenOnlyOptionalItemsUnanswered() async throws {
        let requiredItem = makeItem(
            id: UUID(uuidString: "bbbb0000-0000-0000-0000-000000000001")!,
            code: "FS-001",
            requirement: "required"
        )
        let optionalItem = makeItem(
            id: UUID(uuidString: "bbbb0000-0000-0000-0000-000000000002")!,
            code: "FS-002",
            requirement: "optional"
        )
        let head = makeHead()
        let data = WorkspaceData(
            head: head,
            packageDefinition: PackageDefinition(
                sections: [
                    Section(key: "fire_safety", titleEn: "Fire Safety", titleAr: "سلامة الحريق", items: ["FS-001", "FS-002"])
                ],
                itemRules: nil
            ),
            items: [requiredItem, optionalItem],
            responses: [requiredItem.id.uuidString: ServerResponse(answer: Answer(value: "compliant", note: nil, date: nil), baselineUpdatedAt: "2026-07-25T10:30:45+00:00")]
        )

        let (ws, _, _) = try makeStore(workspaceData: data)
        await ws.load()

        XCTAssertTrue(ws.canSubmit)
    }

    // MARK: - Test: submit() enqueues a .submit op

    func test_submit_enqueuedSubmitOpIntoOutbox() async throws {
        let item = makeItem()
        let data = makeWorkspaceData(item: item, serverAnswerValue: "compliant")
        let (ws, offlineStore, _) = try makeStore(workspaceData: data)
        await ws.load()

        await ws.submit(ack: .object(["status": .string("ok")]))

        // Find submit op in outbox
        let ops = offlineStore.peekAll()
        let submitOps = ops.compactMap { entry -> SubmitOp? in
            if case .submit(let op) = entry.op { return op }
            return nil
        }
        XCTAssertEqual(submitOps.count, 1)
        let submitOp = try XCTUnwrap(submitOps.first)
        XCTAssertEqual(submitOp.inspectionId, "cccc0000-0000-0000-0000-000000000001")
        XCTAssertFalse(submitOp.idempotencyKey.isEmpty)
        XCTAssertEqual(submitOp.acknowledgement, .object(["status": .string("ok")]))
    }

    func test_submit_idempotencyKeyIsUniquePerCall() async throws {
        let item = makeItem()
        let data = makeWorkspaceData(item: item, serverAnswerValue: "compliant")
        let (ws, offlineStore, _) = try makeStore(workspaceData: data)
        await ws.load()

        await ws.submit(ack: .null)
        await ws.submit(ack: .null)

        let ops = offlineStore.peekAll()
        let keys = ops.compactMap { entry -> String? in
            if case .submit(let op) = entry.op { return op.idempotencyKey }
            return nil
        }
        XCTAssertEqual(keys.count, 2)
        XCTAssertNotEqual(keys[0], keys[1])
    }

    func test_submit_callsSyncEngine() async throws {
        let item = makeItem()
        let data = makeWorkspaceData(item: item, serverAnswerValue: "compliant")
        let engineStub = StubSyncEngine()
        let (ws, _, engine) = try makeStore(workspaceData: data, engineStub: engineStub)
        await ws.load()
        let countAfterLoad = engine.processCallCount

        await ws.submit(ack: .null)

        XCTAssertGreaterThan(engine.processCallCount, countAfterLoad)
    }

}
