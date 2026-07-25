import SwiftUI
import DesignSystem
import Components

struct RootShellView: View {
    static let tabs = InspectionTab.allCases

    @State private var selection: InspectionTab = .dashboard
    @EnvironmentObject private var theme: SaqeelTheme

    var body: some View {
        TabView(selection: $selection) {
            ForEach(Self.tabs, id: \.self) { tab in
                tabContent(tab)
                    .tabItem { Label(tab.title, systemImage: tab.systemImage) }
                    .tag(tab)
            }
        }
        .tint(theme.colors.primary)
    }

    @ViewBuilder
    private func tabContent(_ tab: InspectionTab) -> some View {
        VStack(spacing: 0) {
            InspectionHeader(title: tab.title, sync: .synced)
            Spacer()
            Text("\(tab.title) — coming in a later phase")
                .font(SaqeelTypography.body)
                .foregroundColor(theme.colors.textSecondary)
            Spacer()
        }
        .background(theme.colors.canvas)
    }
}
