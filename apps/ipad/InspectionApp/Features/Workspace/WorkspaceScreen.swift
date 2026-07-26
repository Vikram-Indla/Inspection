// WorkspaceScreen.swift
// NavigationStack destination that owns WorkspaceStore via @StateObject.
//
// LIFECYCLE RULE: WorkspaceView takes @ObservedObject — it does NOT own the store.
// The store must be owned here via @StateObject so SwiftUI keeps it alive for the
// full lifetime of the pushed navigation destination.
//
// Task 11 — Phase 2/3 "Inspection Workspace + Offline"

import SwiftUI
import DesignSystem

// MARK: - WorkspaceScreen

/// Full-screen destination for an open inspection.
/// Owns the `WorkspaceStore` via `@StateObject`.
struct WorkspaceScreen: View {

    @StateObject private var store: WorkspaceStore

    /// The inspection UUID string resolved by the caller.
    private let inspectionId: String

    /// Human-readable title shown in the workspace header.
    /// Typically the factory name; falls back to "Inspection".
    private let title: String

    init(inspectionId: String, title: String = "Inspection") {
        self.inspectionId = inspectionId
        self.title = title
        _store = StateObject(wrappedValue: WorkspaceStore(inspectionId: inspectionId))
    }

    var body: some View {
        // WorkspaceView handles its own header (InspectionHeader + sync badge)
        // and calls store.load() internally via .task { await store.load() }.
        WorkspaceView(store: store, title: title)
    }
}

// MARK: - NotStartedScreen

/// Placeholder shown when a visit has no inspection yet.
/// The startup flow (creating a new inspection) arrives in Phase 4.
struct NotStartedScreen: View {

    @EnvironmentObject private var theme: SaqeelTheme

    var body: some View {
        VStack(spacing: SaqeelSpacing.lg) {
            Image(systemName: "clock.badge.questionmark")
                .font(.system(size: 48, weight: .light))
                .foregroundColor(theme.colors.textSecondary)

            Text("Inspection not started")
                .font(SaqeelTypography.heading)
                .foregroundColor(theme.colors.text)

            Text("The startup flow arrives in Phase 4.\nA supervisor must open the inspection before you can begin.")
                .font(SaqeelTypography.body)
                .foregroundColor(theme.colors.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(SaqeelSpacing.xl)
        .background(theme.colors.canvas)
    }
}

// MARK: - ResolvingWorkspaceScreen

/// Resolves the inspection id for a visit asynchronously, then presents the workspace.
/// Shows a ProgressView while resolving; falls back to NotStartedScreen if nil.
struct ResolvingWorkspaceScreen: View {

    let visitId: String

    /// Human-readable title forwarded to `WorkspaceScreen` once resolution completes.
    let title: String

    @State private var state: ResolveState = .loading
    @EnvironmentObject private var theme: SaqeelTheme

    private enum ResolveState {
        case loading
        case resolved(inspectionId: String)
        case notFound
        case error(String)
    }

    var body: some View {
        Group {
            switch state {
            case .loading:
                ProgressView("Opening inspection…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(theme.colors.canvas)

            case .resolved(let inspectionId):
                WorkspaceScreen(inspectionId: inspectionId, title: title)

            case .notFound:
                NotStartedScreen()

            case .error(let message):
                VStack(spacing: SaqeelSpacing.md) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 32, weight: .regular))
                        .foregroundColor(theme.colors.critical)
                    Text("Couldn't open workspace")
                        .font(SaqeelTypography.subheading)
                        .foregroundColor(theme.colors.text)
                    Text(message)
                        .font(SaqeelTypography.caption)
                        .foregroundColor(theme.colors.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(SaqeelSpacing.xl)
                .background(theme.colors.canvas)
            }
        }
        .task { await resolve() }
    }

    // MARK: - Private

    private func resolve() async {
        // Use the production OfflineStore path to match WorkspaceStore's convenience init.
        let storePath = WorkspaceStore.productionStorePath()
        guard let offlineStore = try? OfflineStore(path: storePath) else {
            state = .error("Could not open local store.")
            return
        }
        let repo = SupabaseWorkspaceRepository(store: offlineStore)
        do {
            if let id = try await repo.openInspection(forVisit: visitId) {
                state = .resolved(inspectionId: id)
            } else {
                state = .notFound
            }
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}
