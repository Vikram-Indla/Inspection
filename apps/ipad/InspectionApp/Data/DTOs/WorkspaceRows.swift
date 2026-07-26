import Foundation

// MARK: - WorkspaceRows (decoder factory)

/// Namespace for workspace DTO decoder.
/// `ResponseRow.updatedAt` is stored as a raw String (not Date) so we do not
/// need a custom date strategy here; the decoder factory is provided for
/// convenience and future extension.
enum WorkspaceRows {
    /// Returns a JSONDecoder suitable for workspace rows.
    /// Uses the same fractional-second stripping approach as `VisitRow.decoder()`
    /// for any timestamp fields decoded as `Date`.  (ResponseRow stores the
    /// timestamp as a raw String, so this is a no-op for current models but
    /// keeps the pattern consistent for future callers.)
    static func decoder() -> JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .custom { decoder in
            let raw = try decoder.singleValueContainer().decode(String.self)
            // Strip fractional seconds to handle .225 / .22 / none from Supabase.
            let normalized = raw.replacingOccurrences(
                of: #"\.\d+"#, with: "", options: .regularExpression)
            let iso = ISO8601DateFormatter()
            iso.formatOptions = [.withInternetDateTime]
            if let date = iso.date(from: normalized) { return date }
            iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = iso.date(from: raw) { return date }
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "Bad date \(raw)"))
        }
        return d
    }
}

// MARK: - PackageVersionRow

/// DTO for a `package_versions` row, optionally embedding a `packages` row.
struct PackageVersionRow: Decodable {
    let id: UUID
    let versionLabel: String
    let definition: PackageDefinition
    let packages: PkgRow?

    enum CodingKeys: String, CodingKey {
        case id
        case versionLabel = "version_label"
        case definition
        case packages
    }
}

// MARK: - PkgRow

/// Embedded `packages` row (minimal — extend as needed by later tasks).
struct PkgRow: Decodable {
    let id: UUID
    let name: String?
}

// MARK: - ItemRow

/// DTO for an `inspection_items` row.
struct ItemRow: Decodable {
    let id: UUID
    let code: String
    let title: String
    let responseModel: ResponseModel
    let evidenceRule: EvidenceRule?
    let guidanceEn: String?
    let guidanceAr: String?

    enum CodingKeys: String, CodingKey {
        case id
        case code
        case title
        case responseModel = "response_model"
        case evidenceRule = "evidence_rule"
        case guidanceEn = "guidance_en"
        case guidanceAr = "guidance_ar"
    }

    func toDomain() -> InspectionItemDef {
        InspectionItemDef(
            id: id,
            code: code,
            title: title,
            responseModel: responseModel,
            evidenceRule: evidenceRule,
            guidanceEn: guidanceEn,
            guidanceAr: guidanceAr
        )
    }
}

// MARK: - ResponseRow

/// DTO for an `inspection_responses` row.
/// `updatedAt` is kept as a raw String to preserve the original Supabase
/// timestamp for conflict-detection (baseline comparison).
struct ResponseRow: Decodable {
    let itemId: UUID
    let response: Answer?
    /// Raw timestamp string from Supabase (e.g. "2026-07-25T10:30:45.22+00:00").
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case itemId = "item_id"
        case response
        case updatedAt = "updated_at"
    }
}

// MARK: - InspectionHeadRow

/// DTO for an `inspections` row, embedding its `package_versions` row.
struct InspectionHeadRow: Decodable {
    let id: UUID
    let status: String
    let visitId: UUID
    let packageVersions: PackageVersionRow

    enum CodingKeys: String, CodingKey {
        case id
        case status
        case visitId = "visit_id"
        case packageVersions = "package_versions"
    }
}
