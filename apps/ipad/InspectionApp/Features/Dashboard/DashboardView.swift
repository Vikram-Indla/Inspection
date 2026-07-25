import SwiftUI
import DesignSystem
import Components

struct DashboardView: View {
    @StateObject private var store = DashboardStore()
    @EnvironmentObject private var theme: SaqeelTheme

    private var kpiCells: [(String, Int)] {
        [("Today", store.kpis.today), ("Remaining", store.kpis.remaining),
         ("Need attention", store.kpis.needAttention), ("In progress", store.kpis.inProgress)]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: SaqeelSpacing.lg) {
                if let err = store.errorMessage {
                    Text(err).font(SaqeelTypography.caption).foregroundColor(theme.colors.critical)
                }
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 160), spacing: SaqeelSpacing.md)],
                          spacing: SaqeelSpacing.md) {
                    ForEach(kpiCells, id: \.0) { cell in
                        SaqeelCard {
                            Text("\(cell.1)").font(SaqeelTypography.metric).foregroundColor(theme.colors.primary)
                            Text(cell.0).font(SaqeelTypography.label).foregroundColor(theme.colors.textSecondary)
                        }
                    }
                }
                Text("Needs attention").font(SaqeelTypography.heading).foregroundColor(theme.colors.text)
                if store.attention.isEmpty {
                    Text("Nothing needs attention.").font(SaqeelTypography.caption)
                        .foregroundColor(theme.colors.textSecondary)
                } else {
                    ForEach(store.attention) { item in VisitCard(item: item, onOpen: {}) }
                }
            }
            .padding(SaqeelSpacing.lg)
        }
        .background(theme.colors.canvas)
        .task { await store.load() }
    }
}
