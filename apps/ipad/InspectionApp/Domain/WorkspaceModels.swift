// WorkspaceModels.swift
// Domain models for the inspection workspace — loaded by WorkspaceRepository
// and consumed by WorkspaceStore (Task 7) and ItemVM (Task 8).

import Foundation

// MARK: - ServerResponse

/// A response fetched from the server for a single checklist item.
/// Preserves the raw `updatedAt` string for conflict-detection baseline.
struct ServerResponse: Equatable {
    let answer: Answer
    let baselineUpdatedAt: String
}

// MARK: - WorkspaceData

/// The complete in-memory workspace for one inspection.
/// Produced by `WorkspaceRepository.loadWorkspace(inspectionId:)`.
struct WorkspaceData {
    /// The inspection head (id, status, visit_id, embedded package version).
    let head: InspectionHeadRow
    /// The package definition (sections + item_rules).
    let packageDefinition: PackageDefinition
    /// All inspection item definitions referenced by the package, in fetch order.
    let items: [InspectionItemDef]
    /// Server responses keyed by item UUID string.
    let responses: [String: ServerResponse]
}
