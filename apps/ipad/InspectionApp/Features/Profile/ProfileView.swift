import SwiftUI
import DesignSystem
import Components

struct ProfileView: View {
    @StateObject private var store = ProfileStore()
    @EnvironmentObject private var session: AuthSession
    @EnvironmentObject private var theme: SaqeelTheme

    var body: some View {
        VStack(alignment: .leading, spacing: SaqeelSpacing.lg) {
            SaqeelCard {
                Text(store.identity?.fullName ?? "—")
                    .font(SaqeelTypography.subheading).foregroundColor(theme.colors.text)
                if let email = store.identity?.email {
                    Text(email).font(SaqeelTypography.caption).foregroundColor(theme.colors.textSecondary)
                }
            }
            SaqeelButton("Sign out", style: .danger) { Task { await session.signOut() } }
            Spacer()
        }
        .padding(SaqeelSpacing.lg)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(theme.colors.canvas)
        .task { await store.load() }
    }
}
