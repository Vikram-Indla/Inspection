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
