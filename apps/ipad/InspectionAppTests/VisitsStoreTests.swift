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
