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

    /// Regression: a visit with executionDate == nil whose windowStart is today (Riyadh)
    /// must be included by .today after the windowStart fallback was added to VisitFilter.
    func test_todayFilter_includesWindowStartFallback() {
        let todayISODate = VisitScheduling.riyadhDateString(Date())

        // Item with nil executionDate but windowStart = now (i.e. today in Riyadh).
        let windowStartOnly: VisitListItem = {
            let v = Visit(id: UUID(), factoryId: UUID(), visitType: "t", executionMode: .physical,
                          planningStatus: .published, operationalState: .new,
                          windowStart: Date(), windowEnd: Date(), executionDate: nil, priority: nil)
            return VisitListItem(visit: v, factory: nil, inspectionLifecycle: nil)
        }()

        // Item with an old executionDate (should be excluded).
        let oldItem: VisitListItem = {
            let v = Visit(id: UUID(), factoryId: UUID(), visitType: "t", executionMode: .physical,
                          planningStatus: .published, operationalState: .new,
                          windowStart: Date(timeIntervalSinceNow: -86400 * 30),
                          windowEnd: Date(timeIntervalSinceNow: -86400 * 30),
                          executionDate: "2026-01-01", priority: nil)
            return VisitListItem(visit: v, factory: nil, inspectionLifecycle: nil)
        }()

        let result = VisitFilter.today.apply(to: [windowStartOnly, oldItem], todayISODate: todayISODate)
        XCTAssertEqual(result.count, 1, "windowStart-only item scheduled today should be included")
        XCTAssertEqual(result.first?.visit.id, windowStartOnly.visit.id)
    }
}
