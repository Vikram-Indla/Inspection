import Foundation

// MARK: - InspectionItemDef

/// Domain model for a single inspection item (row from `inspection_items`).
struct InspectionItemDef: Identifiable, Equatable {
    let id: UUID
    let code: String
    let title: String
    let responseModel: ResponseModel
    let evidenceRule: EvidenceRule?
    let guidanceEn: String?
    let guidanceAr: String?
}

// MARK: - ResponseModel

/// The `response_model` jsonb column of `inspection_items`.
struct ResponseModel: Codable, Equatable {
    /// Ordered list of valid response option strings (e.g. ["compliant","non_compliant","na"]).
    let responses: [String]?
    /// Scoring/mapping kept as opaque JSONValue — not rendered by the UI.
    let mapping: JSONValue?
    /// Conditional branching rules — kept opaque.
    let conditional: JSONValue?
    /// e.g. "mandatory" or "optional".
    let requirement: String?
}

// MARK: - EvidenceRule

/// The `evidence_rule` jsonb column of `inspection_items`.
struct EvidenceRule: Codable, Equatable {
    /// Response value that triggers the rule (e.g. "non_compliant").
    let on: String?
    /// Evidence type required (e.g. "photo").
    let type: String?
    /// Minimum number of evidence items.
    let min: Int?
    /// Whether evidence is mandatory when triggered.
    let mandatory: Bool?
}
