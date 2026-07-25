import Foundation
import Components

enum VisitStatusPresentation {
    static func planningTone(_ s: PlanningStatus) -> LozengeTone {
        switch s {
        case .published: return .success
        case .returned:  return .warning
        case .cancelled, .expired: return .critical
        case .draft:     return .neutral
        }
    }

    static func lifecycleLabel(_ l: InspectionLifecycle?) -> String {
        switch l {
        case .none:         return "Not started"
        case .new:          return "New"
        case .in_progress:  return "In progress"
        case .returned:     return "Returned"
        case .approved:     return "Approved"
        case .rejected:     return "Rejected"
        case .cancelled:    return "Cancelled"
        }
    }

    static func lifecycleTone(_ l: InspectionLifecycle?) -> LozengeTone {
        switch l {
        case .approved: return .success
        case .returned, .rejected: return .critical
        case .in_progress: return .info
        default: return .neutral
        }
    }
}
