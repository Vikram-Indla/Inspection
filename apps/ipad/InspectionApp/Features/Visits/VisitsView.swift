import SwiftUI
import DesignSystem
import Components

struct VisitsView: View {
    @StateObject private var store = VisitsStore()
    @EnvironmentObject private var theme: SaqeelTheme

    // MARK: - Navigation state

    /// The visit whose workspace is being opened.
    /// Non-nil drives `.navigationDestination(item:)` below.
    @State private var selectedItem: VisitListItem?

    private var segments: [SaqeelSegmented<VisitFilter>.Segment] {
        VisitFilter.allCases.map { f in
            .init(value: f, title: f.title,
                  count: f == .all ? nil : store.count(for: f))
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            SaqeelSegmented(segments, selection: $store.filter)
                .padding(.horizontal, SaqeelSpacing.lg)
                .padding(.vertical, SaqeelSpacing.md)

            Group {
                if store.isLoading {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let err = store.errorMessage {
                    emptyState(icon: "exclamationmark.triangle", title: "Couldn't load visits",
                               message: err, tone: theme.colors.critical)
                } else if store.visible.isEmpty {
                    emptyState(icon: "tray", title: "No visits",
                               message: "Nothing matches this filter.", tone: theme.colors.textSecondary)
                } else {
                    ScrollView {
                        LazyVStack(spacing: SaqeelSpacing.sm) {
                            ForEach(store.visible) { item in
                                VisitCard(item: item, onOpen: {
                                    selectedItem = item
                                })
                            }
                        }
                        .padding(.horizontal, SaqeelSpacing.lg)
                        .padding(.bottom, SaqeelSpacing.xl)
                    }
                }
            }
        }
        .background(theme.colors.canvas)
        .task { await store.load() }
        // MARK: – Navigation destination (pushed inside RootShellView's NavigationStack)
        .navigationDestination(item: $selectedItem) { item in
            workspaceDestination(for: item)
        }
    }

    // MARK: - Route → destination mapping

    @ViewBuilder
    private func workspaceDestination(for item: VisitListItem) -> some View {
        switch WorkspaceRouter.route(for: item) {
        case .open:
            let displayTitle = item.factory?.name ?? "Inspection"
            ResolvingWorkspaceScreen(visitId: item.visit.id.uuidString, title: displayTitle)
        case .notStarted:
            NotStartedScreen()
        }
    }

    private func emptyState(icon: String, title: String, message: String, tone: Color) -> some View {
        VStack(spacing: SaqeelSpacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 32, weight: .regular))
                .foregroundColor(theme.colors.textSecondary)
            Text(title).font(SaqeelTypography.subheading).foregroundColor(theme.colors.text)
            Text(message).font(SaqeelTypography.caption).foregroundColor(tone)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(SaqeelSpacing.xl)
    }
}
