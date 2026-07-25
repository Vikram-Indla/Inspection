import Foundation

enum VisitFilter: String, CaseIterable {
    case all, today, inProgress, returned, submitted

    var title: String {
        switch self {
        case .all: return "All"
        case .today: return "Today"
        case .inProgress: return "In progress"
        case .returned: return "Returned"
        case .submitted: return "Submitted"
        }
    }

    func apply(to items: [VisitListItem], todayISODate: String) -> [VisitListItem] {
        switch self {
        case .all: return items
        case .today: return items.filter { $0.visit.executionDate == todayISODate }
        case .inProgress: return items.filter { $0.inspectionLifecycle == .in_progress }
        case .returned: return items.filter { $0.inspectionLifecycle == .returned }
        case .submitted:
            return items.filter { $0.visit.operationalState == .submitted || $0.inspectionLifecycle == .approved }
        }
    }
}
