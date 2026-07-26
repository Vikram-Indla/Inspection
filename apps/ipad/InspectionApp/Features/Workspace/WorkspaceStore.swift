// WorkspaceStore.swift
// @MainActor ObservableObject that loads an inspection workspace, hydrates answers
// (server responses overlaid by local GRDB drafts), autosaves drafts, queues outbox
// ops, and drives sync via SyncEngine.
//
// Task 7 — Phase 2/3 "Inspection Workspace + Offline"

import Foundation

// MARK: - WorkspaceStore

@MainActor
final class WorkspaceStore: ObservableObject {

    // MARK: - Engine factory type alias

    /// Returns an async closure that drives one sync pass.
    /// Signature: (OfflineStore, any RemoteSyncGateway, @escaping () -> Bool) -> (() async -> SyncState)
    /// Tests inject a stub; production wires up SyncEngine + SupabaseSyncGateway.
    typealias EngineFactory = (OfflineStore, any RemoteSyncGateway, @escaping () -> Bool) -> (() async -> SyncState)

    // MARK: - Published state

    @Published private(set) var sections: [SectionVM] = []
    @Published private(set) var answers: [String: Answer] = [:]
    @Published private(set) var sync: SyncState = .pending
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?
    @Published private(set) var progress: (answered: Int, total: Int) = (0, 0)
    /// Number of evidence items queued per checklist-item UUID string. Task 9.
    @Published private(set) var evidenceCounts: [String: Int] = [:]

    // MARK: - Private state

    private let inspectionId: String
    /// Captured from `WorkspaceData.head.visitId` on load. Forwarded into EvidenceOp. Task 9.
    private var visitId: String?
    private let repository: any WorkspaceRepository
    private let store: OfflineStore
    private let engineFactory: EngineFactory
    private let todayProvider: () -> String

    /// The engine process closure, built lazily on first sync.
    private var engineProcess: (() async -> SyncState)?

    /// Server baselines keyed by itemId (item.id.uuidString) — for conflict detection.
    private var serverBaselines: [String: String] = [:]

    /// Full ordered item list from the loaded workspace (for canSubmit / progress).
    private var allItems: [InspectionItemDef] = []

    // MARK: - Init

    /// - Parameters:
    ///   - inspectionId: The UUID string of the inspection to load.
    ///   - repository: Fetches workspace data from Supabase (or a test stub).
    ///   - store: GRDB offline store. Defaults to the shared production store.
    ///   - engineFactory: Builds the sync engine process closure. Production uses SyncEngine + SupabaseSyncGateway.
    ///   - todayProvider: Returns today's ISO date string. Defaults to the Riyadh clock.
    init(
        inspectionId: String,
        repository: any WorkspaceRepository,
        store: OfflineStore,
        engineFactory: @escaping EngineFactory,
        todayProvider: @escaping () -> String = DashboardStore.riyadhToday
    ) {
        self.inspectionId = inspectionId
        self.repository = repository
        self.store = store
        self.engineFactory = engineFactory
        self.todayProvider = todayProvider
    }

    /// Convenience initializer with production defaults.
    convenience init(inspectionId: String) {
        let storePath = WorkspaceStore.productionStorePath()
        let offlineStore = (try? OfflineStore(path: storePath)) ?? (try! OfflineStore.inMemory())
        let repo = SupabaseWorkspaceRepository(store: offlineStore)
        self.init(
            inspectionId: inspectionId,
            repository: repo,
            store: offlineStore,
            engineFactory: WorkspaceStore.productionEngineFactory,
            todayProvider: DashboardStore.riyadhToday
        )
    }

    // MARK: - load()

    /// Loads the workspace: fetches from server, falls back to cached package if offline,
    /// hydrates answers from server responses then overlays GRDB drafts.
    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let data = try await repository.loadWorkspace(inspectionId: inspectionId)
            applyWorkspaceData(data)
        } catch {
            // Offline fallback: try the cached package.
            // If we have no cached data either, surface the error.
            if let cached = store.cachedPackage(inspectionId: inspectionId),
               let definition = try? JSONDecoder().decode(PackageDefinition.self, from: cached) {
                // Build minimal workspace from cache — responses from GRDB drafts only
                let drafts = store.allDrafts(inspectionId: inspectionId)
                var hydratedAnswers: [String: Answer] = [:]
                for (itemId, answer) in drafts {
                    hydratedAnswers[itemId] = answer
                }
                answers = hydratedAnswers
                sections = buildSections(definition: definition, items: [], answers: hydratedAnswers)
                sync = .offline
                recomputeProgress()
            } else {
                errorMessage = error.localizedDescription
            }
        }
    }

    // MARK: - answer()

    /// Merges a patch into the current answer, saves to GRDB, enqueues a response op
    /// (only when value != nil), recomputes progress, and triggers a sync pass.
    func answer(itemId: String, patch: Answer) async {
        // Merge patch into existing answer
        let existing = answers[itemId] ?? Answer(value: nil, note: nil, date: nil)
        let merged = Answer(
            value: patch.value ?? existing.value,
            note: patch.note ?? existing.note,
            date: patch.date ?? existing.date
        )
        answers[itemId] = merged

        // Persist draft
        try? store.saveDraft(inspectionId: inspectionId, itemId: itemId, merged)

        // Enqueue response op only when value is set
        if merged.value != nil {
            let op = ResponseOp(
                inspectionId: inspectionId,
                itemId: itemId,
                response: merged,
                baselineUpdatedAt: serverBaselines[itemId],
                queuedAt: isoNow()
            )
            try? store.enqueue(.response(op))
        }

        recomputeProgress()

        await triggerSync()
    }

    // MARK: - sync()

    /// Runs one pass of the sync engine and updates the published sync state.
    func sync() async {
        await triggerSync()
    }

    // MARK: - canSubmit

    /// `true` when all items with `requirement == "required"` have a non-nil answer value.
    var canSubmit: Bool {
        let requiredItems = allItems.filter { $0.responseModel.requirement == "required" }
        guard !requiredItems.isEmpty else { return true }
        return requiredItems.allSatisfy { item in
            answers[item.id.uuidString]?.value != nil
        }
    }

    // MARK: - submit()

    /// Builds a snapshot JSONValue from current answers, enqueues a `.submit` op with a
    /// unique idempotency key, and triggers a sync pass.
    ///
    /// - versionNumber: Defaults to 1 for this slice — a future task will derive the
    ///   actual submission count from WorkspaceData.head once that field is added.
    /// - Parameter ack: The acknowledgement payload from the server (or a local stub).
    func submit(ack: JSONValue) async {
        let snapshot = buildSnapshot()
        let idempotencyKey = UUID().uuidString
        let now = isoNow()

        let op = SubmitOp(
            inspectionId: inspectionId,
            versionNumber: 1,   // decision: default to 1; see task-7-report.md
            snapshot: snapshot,
            idempotencyKey: idempotencyKey,
            acknowledgement: ack,
            queuedAt: now
        )
        try? store.enqueue(.submit(op))

        await triggerSync()
    }

    // MARK: - attachPhoto (Task 9)

    /// Builds an `EvidenceOp` from JPEG image data, enqueues it into the offline outbox,
    /// increments the per-item evidence count, and triggers a sync pass.
    ///
    /// - Parameters:
    ///   - itemId: The checklist item's UUID string (`item.id.uuidString`).
    ///   - imageData: Raw JPEG bytes.
    func attachPhoto(itemId: String, imageData: Data) async {
        let now = isoNow()
        let op = EvidenceCapture.makeEvidenceOp(
            inspectionId: inspectionId,
            visitId: visitId,
            itemId: itemId,
            imageData: imageData,
            capturedAt: now
        )
        do {
            try store.enqueue(.evidence(op))
        } catch {
            errorMessage = "Failed to queue photo evidence. Please try again."
            return
        }

        // Increment the per-item queued count so the UI badge updates.
        // Only reached when the enqueue succeeded — preserves evidence-chain integrity.
        evidenceCounts[itemId, default: 0] += 1

        await triggerSync()
    }

    // MARK: - Private helpers

    private func applyWorkspaceData(_ data: WorkspaceData) {
        allItems = data.items

        // Capture visitId for EvidenceOp. Task 9.
        visitId = data.head.visitId.uuidString

        // Record server baselines for conflict detection
        serverBaselines = data.responses.mapValues { $0.baselineUpdatedAt }

        // Hydrate: start with server responses, then overlay GRDB drafts
        var hydratedAnswers: [String: Answer] = [:]
        for (itemId, serverResponse) in data.responses {
            hydratedAnswers[itemId] = serverResponse.answer
        }
        let drafts = store.allDrafts(inspectionId: inspectionId)
        for (itemId, draft) in drafts {
            hydratedAnswers[itemId] = draft
        }
        answers = hydratedAnswers

        sections = buildSections(
            definition: data.packageDefinition,
            items: data.items,
            answers: hydratedAnswers
        )

        recomputeProgress()
    }

    private func buildSections(
        definition: PackageDefinition,
        items: [InspectionItemDef],
        answers: [String: Answer]
    ) -> [SectionVM] {
        // Build code → item lookup for fast access
        let itemsByCode = Dictionary(uniqueKeysWithValues: items.map { ($0.code, $0) })

        return definition.sections.map { section in
            let sectionItems = section.items.compactMap { itemsByCode[$0] }
            let answeredCount = sectionItems.filter { answers[$0.id.uuidString]?.value != nil }.count
            return SectionVM(
                id: section.key,
                title: section.titleEn,
                items: sectionItems,
                answeredCount: answeredCount
            )
        }
    }

    private func recomputeProgress() {
        let total = allItems.count
        let answered = allItems.filter { answers[$0.id.uuidString]?.value != nil }.count
        progress = (answered: answered, total: total)

        // Also refresh sections' answeredCount
        sections = sections.map { section in
            let sectionAnswered = section.items.filter { answers[$0.id.uuidString]?.value != nil }.count
            return SectionVM(
                id: section.id,
                title: section.title,
                items: section.items,
                answeredCount: sectionAnswered
            )
        }
    }

    private func buildSnapshot() -> JSONValue {
        // Build a answers snapshot keyed by itemId
        var answersMap: [String: JSONValue] = [:]
        for (itemId, answer) in answers {
            var fields: [String: JSONValue] = [:]
            if let v = answer.value { fields["value"] = .string(v) }
            if let n = answer.note { fields["note"] = .string(n) }
            if let d = answer.date { fields["date"] = .string(d) }
            answersMap[itemId] = .object(fields)
        }
        return .object([
            "inspectionId": .string(inspectionId),
            "capturedAt": .string(isoNow()),
            "answers": .object(answersMap)
        ])
    }

    private func triggerSync() async {
        // Build engine lazily on first call
        if engineProcess == nil {
            let gateway: any RemoteSyncGateway = SupabaseSyncGateway()
            let isOnline: () -> Bool = { true }   // TODO: wire up NWPathMonitor in Task 9
            engineProcess = engineFactory(store, gateway, isOnline)
        }
        guard let process = engineProcess else { return }
        sync = await process()
    }

    private func isoNow() -> String {
        ISO8601DateFormatter().string(from: Date())
    }

    // MARK: - Production defaults

    nonisolated static func productionStorePath() -> String {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return docs.appendingPathComponent("inspection_offline.sqlite").path
    }

    nonisolated static let productionEngineFactory: EngineFactory = { store, gateway, isOnline in
        let engine = SyncEngine(store: store, gateway: gateway, isOnline: isOnline)
        return { await engine.process() }
    }
}
