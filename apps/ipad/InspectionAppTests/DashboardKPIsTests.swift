import XCTest
@testable import InspectionApp

final class DashboardKPIsTests: XCTestCase {
    private func item(date: String?, lifecycle: InspectionLifecycle?,
                      state: OperationalState = .new,
                      plan: PlanningStatus = .published) -> VisitListItem {
        let v = Visit(id: UUID(), factoryId: UUID(), visitType: "periodic",
                      executionMode: .physical, planningStatus: plan, operationalState: state,
                      windowStart: Date(), windowEnd: Date(), executionDate: date, priority: nil)
        return VisitListItem(visit: v, factory: nil, inspectionLifecycle: lifecycle)
    }

    func test_countsTodayRemainingAttentionInProgress() {
        let today = "2026-07-25"
        let items = [
            item(date: today, lifecycle: nil),                      // today, remaining
            item(date: today, lifecycle: .in_progress),             // today, remaining, in-progress
            item(date: today, lifecycle: .approved),                // today, NOT remaining
            item(date: "2026-07-20", lifecycle: .returned),         // not today, attention
            item(date: today, lifecycle: nil, state: .submitted),   // today, submitted → not remaining
        ]
        let k = DashboardKPIs.compute(from: items, todayISODate: today)
        XCTAssertEqual(k.today, 4)          // four with executionDate == today
        XCTAssertEqual(k.remaining, 2)      // today & not approved & not submitted
        XCTAssertEqual(k.needAttention, 1)  // one returned
        XCTAssertEqual(k.inProgress, 1)
    }

    func test_attentionItemsAreReturnedOnes() {
        let items = [item(date: nil, lifecycle: .returned), item(date: nil, lifecycle: .approved)]
        XCTAssertEqual(DashboardKPIs.attentionItems(from: items).count, 1)
    }
}
