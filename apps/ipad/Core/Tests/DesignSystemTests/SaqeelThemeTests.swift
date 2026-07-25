import XCTest
import SwiftUI
@testable import DesignSystem

@MainActor
final class SaqeelThemeTests: XCTestCase {
    func test_defaultsToLight() {
        let theme = SaqeelTheme()
        XCTAssertEqual(UIColor(theme.colors.canvas), UIColor(SaqeelColorScheme.light.canvas))
    }

    func test_applyDarkSwapsScheme() {
        let theme = SaqeelTheme()
        theme.apply(dark: true)
        XCTAssertEqual(UIColor(theme.colors.canvas), UIColor(SaqeelColorScheme.dark.canvas))
    }
}
