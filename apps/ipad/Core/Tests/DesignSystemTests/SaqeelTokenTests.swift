import XCTest
@testable import DesignSystem

final class SaqeelTokenTests: XCTestCase {
    func test_spacingGridIs4pxBased() {
        XCTAssertEqual(SaqeelSpacing.hairline, 4)
        XCTAssertEqual(SaqeelSpacing.xs, 8)
        XCTAssertEqual(SaqeelSpacing.md, 16)
        XCTAssertEqual(SaqeelSpacing.xxl, 48)
    }

    func test_fieldDensityIs52ForTouchTargets() {
        XCTAssertEqual(SaqeelDensity.field, 52)
        XCTAssertEqual(SaqeelDensity.minTouchTarget, 52)
    }

    func test_inputRadiusIs6() {
        XCTAssertEqual(SaqeelRadius.input, 6)
        XCTAssertEqual(SaqeelRadius.full, 999)
    }

    func test_fontFamilyIsIBMPlexSansArabic() {
        XCTAssertEqual(SaqeelTypography.fontFamily, "IBM Plex Sans Arabic")
    }
}
