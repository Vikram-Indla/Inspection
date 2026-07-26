// WorkspaceView.swift
// Inspection workspace: sections list + submit bar.
// Task 8 — Phase 2/3 "Inspection Workspace + Offline"

import SwiftUI
import DesignSystem
import Components

// MARK: - SyncState bridge helper

/// Maps the app module's SyncState (from SyncEngine) to the Components module's
/// SyncState (consumed by InspectionHeader / StatusLozenge). Both enums have
/// identical cases; Swift does not unify them automatically because they live in
/// separate modules.
private func componentsSyncState(from appState: SyncState) -> Components.SyncState {
    switch appState {
    case .synced:   return .synced
    case .offline:  return .offline
    case .pending:  return .pending
    case .syncing:  return .syncing
    case .conflict: return .conflict
    case .failed:   return .failed
    }
}

// MARK: - WorkspaceView

struct WorkspaceView: View {

    @ObservedObject var store: WorkspaceStore

    /// The inspection identifier shown in the header (e.g. "INS-0042").
    /// Defaults to "Inspection" so existing call sites compile without change.
    /// Task 11 injects the real inspection number here.
    var title: String = "Inspection"

    /// Task 10: optional hook for callers that want to intercept the submit flow.
    /// When nil, the default behavior is to present the `SignatureSheet`.
    var onSubmitTapped: (() -> Void)?

    /// Fixed width shared by the progress bar and submit button in the submit bar.
    private let submitControlWidth: CGFloat = 140

    @EnvironmentObject private var theme: SaqeelTheme

    /// Task 10: controls presentation of the SignatureSheet.
    @State private var showSignature = false

    var body: some View {
        VStack(spacing: 0) {
            // MARK: Header
            InspectionHeader(
                title: title,
                sync: componentsSyncState(from: store.sync)
            )

            // MARK: Content
            Group {
                if store.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)

                } else if let err = store.errorMessage {
                    emptyState(
                        icon: "exclamationmark.triangle",
                        title: "Couldn't load workspace",
                        message: err,
                        tone: theme.colors.critical
                    )

                } else if store.sections.isEmpty {
                    emptyState(
                        icon: "tray",
                        title: "No items",
                        message: "This inspection has no checklist items.",
                        tone: theme.colors.textSecondary
                    )

                } else {
                    sectionsContent
                }
            }

            // MARK: Submit bar
            submitBar
        }
        .background(theme.colors.canvas)
        .task { await store.load() }
        // Task 10: present the signature capture sheet
        .sheet(isPresented: $showSignature) {
            SignatureSheet(store: store)
                .environmentObject(theme)
        }
    }

    // MARK: - Sections scroll content

    private var sectionsContent: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: SaqeelSpacing.md, pinnedViews: []) {
                ForEach(store.sections) { section in
                    sectionBlock(section)
                }
            }
            .padding(.horizontal, SaqeelSpacing.lg)
            .padding(.vertical, SaqeelSpacing.md)
            // Extra bottom padding so last item clears the submit bar
            .padding(.bottom, SaqeelSpacing.xxl + SaqeelSpacing.xl)
        }
    }

    // MARK: - Section block

    private func sectionBlock(_ section: SectionVM) -> some View {
        VStack(alignment: .leading, spacing: SaqeelSpacing.sm) {
            // Section header
            HStack(alignment: .center, spacing: SaqeelSpacing.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(section.title)
                        .font(SaqeelTypography.heading)
                        .foregroundColor(theme.colors.text)
                }

                Spacer(minLength: 0)

                // Completion pill
                let pillTone: LozengeTone = section.isComplete ? .success : .neutral
                StatusPill(
                    "\(section.answeredCount)/\(section.totalCount)",
                    tone: pillTone
                )
            }
            .padding(.vertical, SaqeelSpacing.xs)

            // Items
            ForEach(section.items) { item in
                ChecklistItemView(
                    item: item,
                    answer: store.answers[item.id.uuidString],
                    onAnswer: { patch in
                        await store.answer(itemId: item.id.uuidString, patch: patch)
                    },
                    store: store
                )
            }
        }
    }

    // MARK: - Submit bar

    private var submitBar: some View {
        VStack(spacing: 0) {
            Divider()
                .overlay(theme.colors.border)

            HStack(spacing: SaqeelSpacing.md) {
                // Progress indicator
                let (answered, total) = (store.progress.answered, store.progress.total)
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(answered) of \(total) answered")
                        .font(SaqeelTypography.caption)
                        .foregroundColor(theme.colors.textSecondary)

                    ProgressView(value: total > 0 ? Double(answered) / Double(total) : 0)
                        .tint(theme.colors.primary)
                        .frame(width: submitControlWidth)
                }

                Spacer(minLength: 0)

                // Submit button — Task 10: presents SignatureSheet by default,
                // or calls onSubmitTapped if the caller overrides the flow.
                SaqeelButton(
                    "Submit",
                    style: .primary,
                    isEnabled: store.canSubmit
                ) {
                    if let customAction = onSubmitTapped {
                        customAction()
                    } else {
                        showSignature = true
                    }
                }
                .frame(width: submitControlWidth)
            }
            .padding(.horizontal, SaqeelSpacing.lg)
            .padding(.vertical, SaqeelSpacing.md)
            .background(theme.colors.surface)
        }
    }

    // MARK: - Empty state

    private func emptyState(
        icon: String,
        title: String,
        message: String,
        tone: Color
    ) -> some View {
        VStack(spacing: SaqeelSpacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 32, weight: .regular))
                .foregroundColor(theme.colors.textSecondary)
            Text(title)
                .font(SaqeelTypography.subheading)
                .foregroundColor(theme.colors.text)
            Text(message)
                .font(SaqeelTypography.caption)
                .foregroundColor(tone)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(SaqeelSpacing.xl)
    }
}
