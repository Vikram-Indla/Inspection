// OutboxOp.swift
// Offline queued sync operations for MIM Inspection.

import Foundation

// MARK: - Answer

struct Answer: Codable, Equatable {
    var value: String?
    var note: String?
    var date: String?
}

// MARK: - JSONValue

/// Minimal JSON container so arbitrary `snapshot`/`acknowledgement` shapes round-trip.
enum JSONValue: Codable, Equatable {
    case object([String: JSONValue])
    case array([JSONValue])
    case string(String)
    case number(Double)
    case bool(Bool)
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let b = try? container.decode(Bool.self) {
            self = .bool(b)
        } else if let n = try? container.decode(Double.self) {
            self = .number(n)
        } else if let s = try? container.decode(String.self) {
            self = .string(s)
        } else if let a = try? container.decode([JSONValue].self) {
            self = .array(a)
        } else if let o = try? container.decode([String: JSONValue].self) {
            self = .object(o)
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode JSONValue"
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .null:
            try container.encodeNil()
        case .bool(let b):
            try container.encode(b)
        case .number(let n):
            try container.encode(n)
        case .string(let s):
            try container.encode(s)
        case .array(let a):
            try container.encode(a)
        case .object(let o):
            try container.encode(o)
        }
    }
}

// MARK: - Op Payloads

struct ResponseOp: Codable, Equatable {
    var inspectionId: String
    var itemId: String
    var response: Answer
    var baselineUpdatedAt: String?
    var queuedAt: String
}

struct EvidenceOp: Codable, Equatable {
    var inspectionId: String?
    var visitId: String?
    var linkedType: String
    var linkedId: String
    var evidenceType: String
    var name: String
    var mime: String
    var dataB64: String
    var capturedAt: String
    var sha256: String
    var queuedAt: String
}

struct SubmitOp: Codable, Equatable {
    var inspectionId: String
    var versionNumber: Int
    var snapshot: JSONValue
    var idempotencyKey: String
    var acknowledgement: JSONValue
    var queuedAt: String
}

// MARK: - OutboxOp

enum OutboxOp: Codable, Equatable {
    case response(ResponseOp)
    case evidence(EvidenceOp)
    case submit(SubmitOp)

    var kind: String {
        switch self {
        case .response: return "response"
        case .evidence: return "evidence"
        case .submit: return "submit"
        }
    }

    // MARK: Codable

    private enum CodingKeys: String, CodingKey {
        case kind
        case payload
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let kind = try container.decode(String.self, forKey: .kind)
        switch kind {
        case "response":
            self = .response(try container.decode(ResponseOp.self, forKey: .payload))
        case "evidence":
            self = .evidence(try container.decode(EvidenceOp.self, forKey: .payload))
        case "submit":
            self = .submit(try container.decode(SubmitOp.self, forKey: .payload))
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .kind,
                in: container,
                debugDescription: "Unknown OutboxOp kind: \(kind)"
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(kind, forKey: .kind)
        switch self {
        case .response(let op):
            try container.encode(op, forKey: .payload)
        case .evidence(let op):
            try container.encode(op, forKey: .payload)
        case .submit(let op):
            try container.encode(op, forKey: .payload)
        }
    }
}
