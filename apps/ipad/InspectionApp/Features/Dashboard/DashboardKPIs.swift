import Foundation

struct DashboardKPIs: Equatable {
    let today: Int
    let remaining: Int
    let needAttention: Int
    let inProgress: Int

    static let empty = DashboardKPIs(today: 0, remaining: 0, needAttention: 0, inProgress: 0)

    static func compute(from items: [VisitListItem], todayISODate: String) -> DashboardKPIs {
        let todays = items.filter { $0.visit.planningStatus == .published && isToday($0, todayISODate) }
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

    private static func isToday(_ item: VisitListItem, _ today: String) -> Bool {
        if let d = item.visit.executionDate { return d == today }
        return isoDateString(item.visit.windowStart) == today
    }

    private static func isoDateString(_ date: Date) -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Riyadh") ?? .current
        let c = cal.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }
}
