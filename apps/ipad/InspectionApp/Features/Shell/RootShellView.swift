import SwiftUI
import DesignSystem
import Components

struct RootShellView: View {
    static let tabs = InspectionTab.allCases

    static func usesLiveContent(for tab: InspectionTab) -> Bool {
        switch tab {
        case .dashboard, .visits, .profile: return true
        case .virtual: return false
        }
    }

    @State private var selection: InspectionTab = .dashboard
    @EnvironmentObject private var theme: SaqeelTheme

    var body: some View {
        TabView(selection: $selection) {
            ForEach(Self.tabs, id: \.self) { tab in
                NavigationStack {
                    VStack(spacing: 0) {
                        InspectionHeader(title: tab.title, sync: .synced)
                        tabContent(tab)
                    }
                    .background(theme.colors.canvas)
                }
                .tabItem { Label(tab.title, systemImage: tab.systemImage) }
                .tag(tab)
            }
        }
        .tint(theme.colors.primary)
    }

    @ViewBuilder
    private func tabContent(_ tab: InspectionTab) -> some View {
        switch tab {
        case .dashboard: DashboardView()
        case .visits:    VisitsView()
        case .profile:   ProfileView()
        case .virtual:
            Text("Virtual — coming in a later phase")
                .font(SaqeelTypography.body).foregroundColor(theme.colors.textSecondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}
