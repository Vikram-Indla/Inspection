import SwiftUI
import DesignSystem

public enum InspectionTab: Int, CaseIterable {
    case dashboard, visits, virtual, profile

    public var title: String {
        switch self {
        case .dashboard: return "Dashboard"
        case .visits:    return "Visits"
        case .virtual:   return "Virtual"
        case .profile:   return "Profile"
        }
    }

    public var systemImage: String {
        switch self {
        case .dashboard: return "square.grid.2x2.fill"
        case .visits:    return "list.bullet.rectangle.fill"
        case .virtual:   return "video.fill"
        case .profile:   return "person.crop.circle"
        }
    }
}

public enum SyncState {
    case synced, offline, pending, syncing, conflict, failed

    public var label: String {
        switch self {
        case .synced:   return "Synced"
        case .offline:  return "Offline"
        case .pending:  return "Pending"
        case .syncing:  return "Syncing"
        case .conflict: return "Conflict"
        case .failed:   return "Failed"
        }
    }

    public var domain: LozengeDomain { .sync }

    public var tone: LozengeTone {
        switch self {
        case .synced:            return .success
        case .offline, .pending, .syncing: return .warning
        case .conflict, .failed: return .critical
        }
    }
}
