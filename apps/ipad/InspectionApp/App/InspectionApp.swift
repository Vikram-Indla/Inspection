import SwiftUI
import DesignSystem

@main
struct InspectionApp: App {
    @StateObject private var theme = SaqeelTheme()
    @StateObject private var session = AuthSession()

    var body: some Scene {
        WindowGroup {
            ThemeRoot()
                .environmentObject(theme)
                .environmentObject(session)
        }
    }
}
