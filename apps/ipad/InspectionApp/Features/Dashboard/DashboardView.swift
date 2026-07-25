import SwiftUI
import DesignSystem
import Components

struct DashboardView: View {
    @StateObject private var store = DashboardStore()
    @EnvironmentObject private var theme: SaqeelTheme

    private struct KPI: Identifiable {
        let id = UUID()
        let label: String
        let value: Int
        let tone: (SaqeelColorScheme) -> Color
    }

    private var kpis: [KPI] {
        [
            .init(label: "Today", value: store.kpis.today, tone: { $0.primary }),
            .init(label: "Remaining", value: store.kpis.remaining, tone: { $0.text }),
            .init(label: "Need attention", value: store.kpis.needAttention,
                  tone: { store.kpis.needAttention > 0 ? $0.critical : $0.textSecondary }),
            .init(label: "In progress", value: store.kpis.inProgress, tone: { $0.info }),
        ]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: SaqeelSpacing.lg) {
                if let err = store.errorMessage {
                    errorBanner(err)
                }

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 168), spacing: SaqeelSpacing.md)],
                          spacing: SaqeelSpacing.md) {
                    ForEach(kpis) { kpi in kpiCard(kpi) }
                }

                Text("Needs attention")
                    .font(SaqeelTypography.heading)
                    .foregroundColor(theme.colors.text)
                    .padding(.top, SaqeelSpacing.xs)

                if store.attention.isEmpty {
                    HStack(spacing: SaqeelSpacing.xs) {
                        Image(systemName: "checkmark.circle")
                            .foregroundColor(theme.colors.success)
                        Text("Nothing needs attention.")
                            .font(SaqeelTypography.body)
                            .foregroundColor(theme.colors.textSecondary)
                    }
                    .padding(.vertical, SaqeelSpacing.sm)
                } else {
                    LazyVStack(spacing: SaqeelSpacing.sm) {
                        ForEach(store.attention) { item in VisitCard(item: item, onOpen: {}) }
                    }
                }
            }
            .padding(SaqeelSpacing.lg)
        }
        .background(theme.colors.canvas)
        .task { await store.load() }
    }

    private func kpiCard(_ kpi: KPI) -> some View {
        VStack(alignment: .leading, spacing: SaqeelSpacing.xs) {
            Text("\(kpi.value)")
                .font(SaqeelTypography.metric)
                .foregroundColor(kpi.tone(theme.colors))
            Text(kpi.label)
                .font(SaqeelTypography.label)
                .foregroundColor(theme.colors.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(SaqeelSpacing.md)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: SaqeelRadius.large))
        .overlay(
            RoundedRectangle(cornerRadius: SaqeelRadius.large)
                .stroke(theme.colors.border, lineWidth: 1)
        )
    }

    private func errorBanner(_ message: String) -> some View {
        HStack(alignment: .top, spacing: SaqeelSpacing.sm) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(theme.colors.warning)
            Text(message)
                .font(SaqeelTypography.caption)
                .foregroundColor(theme.colors.text)
            Spacer(minLength: 0)
        }
        .padding(SaqeelSpacing.md)
        .background(theme.colors.warning.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: SaqeelRadius.standard))
    }
}
