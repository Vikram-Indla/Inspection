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
