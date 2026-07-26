import Foundation
@testable import InspectionApp

final class StubGateway: RemoteSyncGateway {
    // Programmable server state: key = "inspectionId:itemId" -> (Answer, updatedAt String)
    var server: [String: (Answer, String)] = [:]

    // Recorded calls
    private(set) var upserts: [(inspectionId: String, itemId: String, response: Answer)] = []
    private(set) var uploads: [EvidenceOp] = []
    private(set) var submits: [SubmitOp] = []

    func serverResponse(inspectionId: String, itemId: String) async throws -> (response: Answer, updatedAt: String)? {
        let key = "\(inspectionId):\(itemId)"
        guard let (answer, updatedAt) = server[key] else { return nil }
        return (response: answer, updatedAt: updatedAt)
    }

    func upsertResponse(inspectionId: String, itemId: String, response: Answer) async throws {
        upserts.append((inspectionId: inspectionId, itemId: itemId, response: response))
    }

    func uploadEvidence(_ op: EvidenceOp) async throws {
        uploads.append(op)
    }

    func insertSubmission(_ op: SubmitOp) async throws {
        submits.append(op)
    }
}
