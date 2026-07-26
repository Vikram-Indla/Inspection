// OfflineStore.swift
// GRDB-backed persistence for drafts, cached packages, the outbox queue, and conflicts.

import Foundation
import GRDB

// MARK: - ConflictRecord

struct ConflictRecord: Equatable {
    var key: String
    var itemId: String
    var local: Answer
    var server: Answer
    var detectedAt: String
}

// MARK: - OfflineStore

final class OfflineStore {

    private let db: DatabaseQueue
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    // MARK: Init

    init(path: String) throws {
        db = try DatabaseQueue(path: path)
        try migrate()
    }

    static func inMemory() throws -> OfflineStore {
        let store = try OfflineStore.__inMemory()
        return store
    }

    // Private designated initialiser used by inMemory() to bypass the public path-based init.
    private init(queue: DatabaseQueue) throws {
        db = queue
        try migrate()
    }

    private static func __inMemory() throws -> OfflineStore {
        let queue = try DatabaseQueue()   // GRDB in-memory queue (no path)
        return try OfflineStore(queue: queue)
    }

    // MARK: Migration

    private func migrate() throws {
        var migrator = DatabaseMigrator()
        migrator.registerMigration("v1") { db in
            try db.create(table: "drafts") { t in
                t.column("key", .text).primaryKey()
                t.column("value", .blob).notNull()
            }
            try db.create(table: "packages") { t in
                t.column("key", .text).primaryKey()
                t.column("value", .blob).notNull()
            }
            try db.create(table: "outbox") { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("op", .blob).notNull()
                t.column("created_at", .text)
            }
            try db.create(table: "conflicts") { t in
                t.column("key", .text).primaryKey()
                t.column("item_id", .text)
                t.column("local", .blob).notNull()
                t.column("server", .blob).notNull()
                t.column("detected_at", .text)
            }
        }
        try migrator.migrate(db)
    }

    // MARK: - Drafts

    func saveDraft(inspectionId: String, itemId: String, _ answer: Answer) throws {
        let key = "\(inspectionId):\(itemId)"
        let data = try encoder.encode(answer)
        try db.write { db in
            try db.execute(
                sql: "INSERT OR REPLACE INTO drafts (key, value) VALUES (?, ?)",
                arguments: [key, data]
            )
        }
    }

    func draft(inspectionId: String, itemId: String) -> Answer? {
        let key = "\(inspectionId):\(itemId)"
        return try? db.read { db in
            guard let row = try Row.fetchOne(db, sql: "SELECT value FROM drafts WHERE key = ?", arguments: [key]),
                  let data = row["value"] as? Data else { return nil }
            return try self.decoder.decode(Answer.self, from: data)
        }
    }

    func allDrafts(inspectionId: String) -> [String: Answer] {
        let prefix = "\(inspectionId):"
        var result: [String: Answer] = [:]
        let rows = (try? db.read { db in
            try Row.fetchAll(db, sql: "SELECT key, value FROM drafts WHERE key LIKE ?", arguments: ["\(prefix)%"])
        }) ?? []
        for row in rows {
            guard let key = row["key"] as? String,
                  let data = row["value"] as? Data,
                  let answer = try? decoder.decode(Answer.self, from: data) else { continue }
            let itemId = String(key.dropFirst(prefix.count))
            result[itemId] = answer
        }
        return result
    }

    // MARK: - Packages

    func cachePackage(inspectionId: String, _ data: Data) throws {
        try db.write { db in
            try db.execute(
                sql: "INSERT OR REPLACE INTO packages (key, value) VALUES (?, ?)",
                arguments: [inspectionId, data]
            )
        }
    }

    func cachedPackage(inspectionId: String) -> Data? {
        try? db.read { db in
            guard let row = try Row.fetchOne(db, sql: "SELECT value FROM packages WHERE key = ?", arguments: [inspectionId]) else { return nil }
            return row["value"] as? Data
        }
    }

    // MARK: - Outbox

    @discardableResult
    func enqueue(_ op: OutboxOp) throws -> Int64 {
        let data = try encoder.encode(op)
        let now = ISO8601DateFormatter().string(from: Date())
        return try db.write { db in
            try db.execute(
                sql: "INSERT INTO outbox (op, created_at) VALUES (?, ?)",
                arguments: [data, now]
            )
            return db.lastInsertedRowID
        }
    }

    func peekAll() -> [(id: Int64, op: OutboxOp)] {
        let rows = (try? db.read { db in
            try Row.fetchAll(db, sql: "SELECT id, op FROM outbox ORDER BY id ASC")
        }) ?? []
        return rows.compactMap { row -> (id: Int64, op: OutboxOp)? in
            guard let id = row["id"] as? Int64,
                  let data = row["op"] as? Data,
                  let op = try? decoder.decode(OutboxOp.self, from: data) else { return nil }
            return (id: id, op: op)
        }
    }

    func remove(id: Int64) throws {
        try db.write { db in
            try db.execute(sql: "DELETE FROM outbox WHERE id = ?", arguments: [id])
        }
    }

    func outboxCount() -> Int {
        (try? db.read { db in
            let row = try Row.fetchOne(db, sql: "SELECT COUNT(*) AS c FROM outbox")
            if let n = row?["c"] as? Int64 { return Int(n) }
            if let n = row?["c"] as? Int { return n }
            return 0
        }) ?? 0
    }

    // MARK: - Conflicts

    func addConflict(key: String, itemId: String, local: Answer, server: Answer) throws {
        let localData = try encoder.encode(local)
        let serverData = try encoder.encode(server)
        let now = ISO8601DateFormatter().string(from: Date())
        try db.write { db in
            try db.execute(
                sql: "INSERT OR REPLACE INTO conflicts (key, item_id, local, server, detected_at) VALUES (?, ?, ?, ?, ?)",
                arguments: [key, itemId, localData, serverData, now]
            )
        }
    }

    func conflicts() -> [ConflictRecord] {
        let rows = (try? db.read { db in
            try Row.fetchAll(db, sql: "SELECT key, item_id, local, server, detected_at FROM conflicts")
        }) ?? []
        return rows.compactMap { row -> ConflictRecord? in
            guard let key = row["key"] as? String,
                  let itemId = row["item_id"] as? String,
                  let localData = row["local"] as? Data,
                  let serverData = row["server"] as? Data,
                  let local = try? decoder.decode(Answer.self, from: localData),
                  let server = try? decoder.decode(Answer.self, from: serverData) else { return nil }
            let detectedAt = (row["detected_at"] as? String) ?? ""
            return ConflictRecord(key: key, itemId: itemId, local: local, server: server, detectedAt: detectedAt)
        }
    }

    func removeConflict(key: String) throws {
        try db.write { db in
            try db.execute(sql: "DELETE FROM conflicts WHERE key = ?", arguments: [key])
        }
    }
}
