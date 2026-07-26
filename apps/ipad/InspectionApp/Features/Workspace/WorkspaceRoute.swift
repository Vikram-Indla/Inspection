// WorkspaceRoute.swift
// Pure routing enum + classifier for Visits → Workspace navigation.
// Task 11 — Phase 2/3 "Inspection Workspace + Offline"

import Foundation

// MARK: - WorkspaceRoute

/// Describes the navigation destination when an inspector taps a VisitCard.
///
/// Case decisions:
///   .in_progress, .returned   → .open  (an inspection exists and is writable)
///   .approved, .rejected, .cancelled → .open  (viewable; the workspace shows its
///                                              read-only / submitted state via the
///                                              server-resolved status in WorkspaceStore)
///   .new, nil                 → .notStarted (no inspection row exists yet; startup
///                                            flow deferred to Phase 4)
///
/// The `inspectionHint` is currently always nil because the visit list item does not
/// carry a pre-fetched inspection id; Task 11 resolves the id asynchronously inside
/// the destination view. A future task may pre-fetch the id server-side and pass it
/// here to skip the extra round-trip.
enum WorkspaceRoute: Equatable {
    /// An inspection exists (or likely exists) for this visit.
    /// `inspectionHint` is reserved for a future pre-fetched id optimisation.
    case open(inspectionHint: String?)

    /// No inspection has been started yet (lifecycle is .new or nil).
    /// Tapping shows a placeholder; the startup flow arrives in Phase 4.
    case notStarted
}

// MARK: - WorkspaceRouter

enum WorkspaceRouter {
    /// Pure, synchronous classifier. Consumed by VisitsView and unit-tested independently.
    static func route(for item: VisitListItem) -> WorkspaceRoute {
        switch item.inspectionLifecycle {
        case .in_progress, .returned, .approved, .rejected, .cancelled:
            return .open(inspectionHint: nil)
        case .new, nil:
            return .notStarted
        }
    }
}
