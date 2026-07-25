import Foundation

struct DashboardKPIs: Equatable {
    let today: Int
    let remaining: Int
    let needAttention: Int
    let inProgress: Int

    static let empty = DashboardKPIs(today: 0, remaining: 0, needAttention: 0, inProgress: 0)

    static func compute(from items: [VisitListItem], todayISODate: String) -> DashboardKPIs {
        let todays = items.filter {
            $0.visit.planningStatus == .published && VisitScheduling.isScheduledToday($0, todayISODate: todayISODate)
        }
        let remaining = todays.filter {
            $0.inspectionLifecycle != .approved && $0.visit.operationalState != .submitted
        }
        let attention = items.filter { $0.inspectionLifecycle == .returned }
        let inProgress = items.filter { $0.inspectionLifecycle == .in_progress }
        return DashboardKPIs(today: todays.count, remaining: remaining.count,
                             needAttention: attention.count, inProgress: inProgress.count)
    }

    static func attentionItems(from items: [VisitListItem]) -> [VisitListItem] {
        items.filter { $0.inspectionLifecycle == .returned }
    }
}
