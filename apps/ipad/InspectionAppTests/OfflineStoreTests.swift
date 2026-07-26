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
