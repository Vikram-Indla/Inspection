import SwiftUI
import DesignSystem

struct ThemeRoot: View {
    @Environment(\.colorScheme) private var systemScheme
    @EnvironmentObject private var theme: SaqeelTheme

    var body: some View {
        AuthGate { RootShellView() }
            .onAppear { theme.apply(dark: systemScheme == .dark) }
            .onChange(of: systemScheme) { _, new in theme.apply(dark: new == .dark) }
    }
}
