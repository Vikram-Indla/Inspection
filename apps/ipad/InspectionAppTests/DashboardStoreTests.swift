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
