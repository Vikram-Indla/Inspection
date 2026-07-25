import XCTest
import SwiftUI
import DesignSystem
@testable import Components

final class StatusLozengeTests: XCTestCase {
    func test_domainGlyphsMatchSaqeelSymbols() {
        XCTAssertEqual(LozengeDomain.plan.glyph, "▣")
        XCTAssertEqual(LozengeDomain.ops.glyph, "●")
        XCTAssertEqual(LozengeDomain.review.glyph, "◆")
        XCTAssertEqual(LozengeDomain.virtual.glyph, "▲")
        XCTAssertEqual(LozengeDomain.sync.glyph, "⟳")
    }

    func test_criticalToneUsesSchemeCritical() {
        XCTAssertEqual(
            UIColor(LozengeTone.critical.tint(in: .light)),
            UIColor(SaqeelColorScheme.light.critical)
        )
    }

    func test_renderedTextIncludesGlyphAndLabel() {
        // Never color alone: the displayed string carries glyph + label.
        let text = StatusLozenge.displayText(glyph: LozengeDomain.review.glyph, label: "Under review")
        XCTAssertEqual(text, "◆ Under review")
    }
}
