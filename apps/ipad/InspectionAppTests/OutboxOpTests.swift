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
