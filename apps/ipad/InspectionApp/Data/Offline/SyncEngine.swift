// SyncEngine.swift
// Offline-first sync engine for MIM Inspection — replays outbox against the remote gateway,
// detects server-wins conflicts, and returns a SyncState.

import Foundation

// MARK: - RemoteSyncGateway

protocol RemoteSyncGateway {
    func serverResponse(inspectionId: String, itemId: String) async throws -> (response: Answer, updatedAt: String)?
    func upsertResponse(inspectionId: String, itemId: String, response: Answer) async throws
    func uploadEvidence(_ op: EvidenceOp) async throws
    func insertSubmission(_ op: SubmitOp) async throws
}

// MARK: - SyncState

enum SyncState: Equatable {
    case synced, offline, pending, syncing, conflict, failed
}

// MARK: - SyncEngine

final class SyncEngine {

    private let store: OfflineStore
    private let gateway: any RemoteSyncGateway
    private let isOnline: () -> Bool

    init(store: OfflineStore, gateway: any RemoteSyncGateway, isOnline: @escaping () -> Bool) {
        self.store = store
        self.gateway = gateway
        self.isOnline = isOnline
    }

    func process() async -> SyncState {
        guard isOnline() else { return .offline }

        let ops = store.peekAll()
        var hadConflict = false

        for (id, op) in ops {
            do {
                switch op {
                case .response(let responseOp):
                    if let serverRow = try await gateway.serverResponse(
                        inspectionId: responseOp.inspectionId,
                        itemId: responseOp.itemId
                    ) {
                        // Check for conflict: server is newer AND answer differs
                        if let baseline = responseOp.baselineUpdatedAt,
                           let baselineDate = parseISO(baseline),
                           let serverDate = parseISO(serverRow.updatedAt),
                           serverDate > baselineDate,
                           serverRow.response != responseOp.response {
                            // Server wins — record conflict, remove from outbox, do NOT upsert
                            try store.addConflict(
                                key: "\(responseOp.inspectionId):\(responseOp.itemId)",
                                itemId: responseOp.itemId,
                                local: responseOp.response,
                                server: serverRow.response
                            )
                            try store.remove(id: id)
                            hadConflict = true
                            continue
                        }
                    }
                    // No conflict — push local answer to server
                    try await gateway.upsertResponse(
                        inspectionId: responseOp.inspectionId,
                        itemId: responseOp.itemId,
                        response: responseOp.response
                    )
                    try store.remove(id: id)

                case .evidence(let evidenceOp):
                    try await gateway.uploadEvidence(evidenceOp)
                    try store.remove(id: id)

                case .submit(let submitOp):
                    do {
                        try await gateway.insertSubmission(submitOp)
                    } catch {
                        let msg = error.localizedDescription.lowercased()
                        if msg.contains("duplicate") || msg.contains("409") {
                            // Idempotent — already submitted; swallow and remove
                        } else {
                            return .failed
                        }
                    }
                    try store.remove(id: id)
                }
            } catch {
                return .failed
            }
        }

        if hadConflict { return .conflict }
        return store.outboxCount() == 0 ? .synced : .pending
    }

    // MARK: - ISO8601 Parsing (tolerant of fractional seconds)

    private func parseISO(_ s: String) -> Date? {
        let normalized = s.replacingOccurrences(of: #"\.\d+"#, with: "", options: .regularExpression)
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime]
        if let d = iso.date(from: normalized) { return d }
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return iso.date(from: s)
    }
}
