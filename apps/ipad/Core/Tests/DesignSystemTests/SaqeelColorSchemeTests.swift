import XCTest
import SwiftUI
@testable import DesignSystem

final class SaqeelColorSchemeTests: XCTestCase {
    // #176B52 = (23,107,82)/255
    func test_lightPrimaryIsSaqeelGreen() {
        let c = SaqeelColorScheme.light.primary.rgbaComponents()
        XCTAssertEqual(c.r, 23.0/255.0, accuracy: 0.002)
        XCTAssertEqual(c.g, 107.0/255.0, accuracy: 0.002)
        XCTAssertEqual(c.b, 82.0/255.0, accuracy: 0.002)
    }

    // #64C2A1 = (100,194,161)/255
    func test_darkPrimaryStaysGreenNotBlue() {
        let c = SaqeelColorScheme.dark.primary.rgbaComponents()
        XCTAssertEqual(c.r, 100.0/255.0, accuracy: 0.002)
        XCTAssertEqual(c.g, 194.0/255.0, accuracy: 0.002)
        XCTAssertEqual(c.b, 161.0/255.0, accuracy: 0.002)
    }

    func test_lightCanvasIsNearWhite() {
        let c = SaqeelColorScheme.light.canvas.rgbaComponents()
        XCTAssertEqual(c.r, 245.0/255.0, accuracy: 0.002) // #F5F7F8
    }
}

private extension Color {
    func rgbaComponents() -> (r: CGFloat, g: CGFloat, b: CGFloat, a: CGFloat) {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        UIColor(self).getRed(&r, green: &g, blue: &b, alpha: &a)
        return (r, g, b, a)
    }
}
