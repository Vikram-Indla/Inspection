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
