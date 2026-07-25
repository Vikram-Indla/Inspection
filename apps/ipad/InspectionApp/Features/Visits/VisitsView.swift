import SwiftUI
import DesignSystem
import Components

struct VisitsView: View {
    @StateObject private var store = VisitsStore()
    @EnvironmentObject private var theme: SaqeelTheme

    var body: some View {
        VStack(spacing: 0) {
            Picker("Filter", selection: $store.filter) {
                ForEach(VisitFilter.allCases, id: \.self) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            .padding(SaqeelSpacing.md)

            if store.isLoading {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let err = store.errorMessage {
                Text(err).font(SaqeelTypography.caption).foregroundColor(theme.colors.critical)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if store.visible.isEmpty {
                Text("No visits.").font(SaqeelTypography.body).foregroundColor(theme.colors.textSecondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: SaqeelSpacing.md) {
                        ForEach(store.visible) { item in VisitCard(item: item, onOpen: {}) }
                    }
                    .padding(SaqeelSpacing.lg)
                }
            }
        }
        .background(theme.colors.canvas)
        .task { await store.load() }
    }
}
