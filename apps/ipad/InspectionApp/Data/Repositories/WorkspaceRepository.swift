// WorkspaceRepository.swift
// Fetches the full inspection workspace from Supabase and caches the package
// JSON to OfflineStore.  Also provides SupabaseSyncGateway for real writes.

import Foundation
import Supabase

// MARK: - WorkspaceRepository Protocol

protocol WorkspaceRepository {
    /// Loads the complete workspace for an inspection: head, package definition,
    /// item definitions, and existing server responses.
    func loadWorkspace(inspectionId: String) async throws -> WorkspaceData

    /// Returns the inspection id for a visit, or nil if none exists.
    func openInspection(forVisit visitId: String) async throws -> String?
}

// MARK: - SupabaseWorkspaceRepository

final class SupabaseWorkspaceRepository: WorkspaceRepository {

    private let client: SupabaseClient
    private let store: OfflineStore

    init(client: SupabaseClient = SupabaseClientProvider.shared,
         store: OfflineStore) {
        self.client = client
        self.store = store
    }

    // MARK: - loadWorkspace

    func loadWorkspace(inspectionId: String) async throws -> WorkspaceData {
        let decoder = WorkspaceRows.decoder()

        // 1. Fetch the inspection head, embedding package_versions + packages
        let headResponse = try await client
            .from("inspections")
            .select("id,status,visit_id,package_versions(id,version_label,definition,packages(id,name))")
            .eq("id", value: inspectionId)
            .limit(1)
            .execute()
        let heads = try decoder.decode([InspectionHeadRow].self, from: headResponse.data)
        guard let head = heads.first else {
            throw WorkspaceRepositoryError.inspectionNotFound(inspectionId)
        }

        let definition = head.packageVersions.definition

        // 2. Cache the raw package definition bytes to OfflineStore
        if let pkgData = try? JSONEncoder().encode(definition) {
            try? store.cachePackage(inspectionId: inspectionId, pkgData)
        }

        // 3. Collect all item codes referenced in the package sections
        let allCodes = definition.sections.flatMap { $0.items }

        // 4. Fetch inspection_items for those codes (filter by code IN (...))
        //    Supabase PostgREST supports .in() for an array of values.
        let items: [InspectionItemDef]
        if allCodes.isEmpty {
            items = []
        } else {
            let itemsResponse = try await client
                .from("inspection_items")
                .select("id,code,title,response_model,evidence_rule,guidance_en,guidance_ar")
                .in("code", values: allCodes)
                .execute()
            let itemRows = try decoder.decode([ItemRow].self, from: itemsResponse.data)
            // Preserve section-defined order
            let itemsByCode = Dictionary(uniqueKeysWithValues: itemRows.map { ($0.code, $0) })
            items = allCodes.compactMap { itemsByCode[$0]?.toDomain() }
        }

        // 5. Fetch existing checklist_responses for this inspection
        let responsesResponse = try await client
            .from("checklist_responses")
            .select("item_id,response,updated_at")
            .eq("inspection_id", value: inspectionId)
            .execute()
        let responseRows = try decoder.decode([ResponseRow].self, from: responsesResponse.data)

        var responsesMap: [String: ServerResponse] = [:]
        for row in responseRows {
            if let answer = row.response {
                let key = row.itemId.uuidString
                responsesMap[key] = ServerResponse(
                    answer: answer,
                    baselineUpdatedAt: row.updatedAt
                )
            }
        }

        return WorkspaceData(
            head: head,
            packageDefinition: definition,
            items: items,
            responses: responsesMap
        )
    }

    // MARK: - openInspection

    func openInspection(forVisit visitId: String) async throws -> String? {
        // Minimal DTO: we only need the id string
        struct InspectionIdRow: Decodable {
            let id: UUID
        }
        let response = try await client
            .from("inspections")
            .select("id")
            .eq("visit_id", value: visitId)
            .limit(1)
            .execute()
        let rows = try JSONDecoder().decode([InspectionIdRow].self, from: response.data)
        return rows.first?.id.uuidString
    }
}

// MARK: - WorkspaceRepositoryError

enum WorkspaceRepositoryError: LocalizedError {
    case inspectionNotFound(String)

    var errorDescription: String? {
        switch self {
        case .inspectionNotFound(let id):
            return "Inspection not found: \(id)"
        }
    }
}

// MARK: - SupabaseSyncGateway

/// Real implementation of `RemoteSyncGateway` that writes to Supabase.
/// Evidence is uploaded to the `evidence` Storage bucket at
/// `<visitId ?? inspectionId>/<name>` then upserted as a DB row.
/// Submit operations are idempotent: a 409/duplicate response is treated as success.
final class SupabaseSyncGateway: RemoteSyncGateway {

    private let client: SupabaseClient

    init(client: SupabaseClient = SupabaseClientProvider.shared) {
        self.client = client
    }

    // MARK: - RemoteSyncGateway

    func serverResponse(inspectionId: String, itemId: String) async throws -> (response: Answer, updatedAt: String)? {
        struct Row: Decodable {
            let response: Answer?
            let updatedAt: String
            enum CodingKeys: String, CodingKey {
                case response
                case updatedAt = "updated_at"
            }
        }
        let result = try await client
            .from("checklist_responses")
            .select("response,updated_at")
            .eq("inspection_id", value: inspectionId)
            .eq("item_id", value: itemId)
            .limit(1)
            .execute()
        let rows = try WorkspaceRows.decoder().decode([Row].self, from: result.data)
        guard let row = rows.first, let answer = row.response else { return nil }
        return (response: answer, updatedAt: row.updatedAt)
    }

    func upsertResponse(inspectionId: String, itemId: String, response: Answer) async throws {
        struct Payload: Encodable {
            let inspectionId: String
            let itemId: String
            let response: Answer
            let updatedAt: String
            enum CodingKeys: String, CodingKey {
                case inspectionId = "inspection_id"
                case itemId = "item_id"
                case response
                case updatedAt = "updated_at"
            }
        }
        let now = ISO8601DateFormatter().string(from: Date())
        let payload = Payload(
            inspectionId: inspectionId,
            itemId: itemId,
            response: response,
            updatedAt: now
        )
        try await client
            .from("checklist_responses")
            .upsert(payload, onConflict: "inspection_id,item_id")
            .execute()
    }

    func uploadEvidence(_ op: EvidenceOp) async throws {
        guard let rawData = Data(base64Encoded: op.dataB64) else {
            throw SupabaseSyncGatewayError.invalidBase64(op.name)
        }

        // Storage path: <visitId ?? inspectionId>/<name>
        let folder = op.visitId ?? op.inspectionId ?? "unknown"
        let storagePath = "\(folder)/\(op.name)"

        // Upload to evidence bucket (upsert: overwrite if exists)
        try await client.storage
            .from("evidence")
            .upload(
                storagePath,
                data: rawData,
                options: FileOptions(contentType: op.mime, upsert: true)
            )

        // Upsert an evidence row in the DB (ignore duplicate on storage_path)
        struct EvidenceRow: Encodable {
            let linkedType: String
            let linkedId: String
            let evidenceType: String
            let name: String
            let mime: String
            let storagePath: String
            let capturedAt: String
            let sha256: String
            enum CodingKeys: String, CodingKey {
                case linkedType = "linked_type"
                case linkedId = "linked_id"
                case evidenceType = "evidence_type"
                case name
                case mime
                case storagePath = "storage_path"
                case capturedAt = "captured_at"
                case sha256
            }
        }
        let row = EvidenceRow(
            linkedType: op.linkedType,
            linkedId: op.linkedId,
            evidenceType: op.evidenceType,
            name: op.name,
            mime: op.mime,
            storagePath: storagePath,
            capturedAt: op.capturedAt,
            sha256: op.sha256
        )
        try await client
            .from("evidence")
            .upsert(row, onConflict: "storage_path", ignoreDuplicates: true)
            .execute()
    }

    func insertSubmission(_ op: SubmitOp) async throws {
        struct SubmissionRow: Encodable {
            let inspectionId: String
            let versionNumber: Int
            let snapshot: JSONValue
            let idempotencyKey: String
            let acknowledgement: JSONValue
            enum CodingKeys: String, CodingKey {
                case inspectionId = "inspection_id"
                case versionNumber = "version_number"
                case snapshot
                case idempotencyKey = "idempotency_key"
                case acknowledgement
            }
        }
        let row = SubmissionRow(
            inspectionId: op.inspectionId,
            versionNumber: op.versionNumber,
            snapshot: op.snapshot,
            idempotencyKey: op.idempotencyKey,
            acknowledgement: op.acknowledgement
        )

        do {
            try await client
                .from("submission_versions")
                .insert(row)
                .execute()
        } catch {
            let msg = error.localizedDescription.lowercased()
            // 409 / duplicate key — treat as idempotent success
            guard msg.contains("duplicate") || msg.contains("409") || msg.contains("unique") else {
                throw error
            }
        }

        // Mark inspection as submitted regardless (idempotent)
        struct StatusPatch: Encodable {
            let status: String
        }
        try await client
            .from("inspections")
            .update(StatusPatch(status: "submitted"))
            .eq("id", value: op.inspectionId)
            .execute()
    }
}

// MARK: - SupabaseSyncGatewayError

enum SupabaseSyncGatewayError: LocalizedError {
    case invalidBase64(String)

    var errorDescription: String? {
        switch self {
        case .invalidBase64(let name):
            return "Cannot decode base-64 data for evidence file: \(name)"
        }
    }
}
