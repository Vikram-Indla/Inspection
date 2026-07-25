import XCTest
import SwiftUI
import DesignSystem
@testable import Components

final class SaqeelButtonTests: XCTestCase {
    func test_primaryBackgroundIsSchemePrimary() {
        let scheme = SaqeelColorScheme.light
        XCTAssertEqual(
            UIColor(SaqeelButtonStyle.primary.background(in: scheme)),
            UIColor(scheme.primary)
        )
    }

    func test_primaryForegroundIsInverseText() {
        let scheme = SaqeelColorScheme.light
        XCTAssertEqual(
            UIColor(SaqeelButtonStyle.primary.foreground(in: scheme)),
            UIColor(scheme.inverseText)
        )
    }

    func test_dangerBackgroundIsCritical() {
        let scheme = SaqeelColorScheme.light
        XCTAssertEqual(
            UIColor(SaqeelButtonStyle.danger.background(in: scheme)),
            UIColor(scheme.critical)
        )
    }

    func test_secondaryBackgroundIsSurface() {
        let scheme = SaqeelColorScheme.light
        XCTAssertEqual(
            UIColor(SaqeelButtonStyle.secondary.background(in: scheme)),
            UIColor(scheme.surface)
        )
    }
}
