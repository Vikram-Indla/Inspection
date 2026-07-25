import XCTest
import Components
@testable import InspectionApp

final class RootShellTabsTests: XCTestCase {
    // The shell must expose exactly the four inspector tabs, in order.
    func test_shellUsesFourInspectorTabs() {
        XCTAssertEqual(RootShellView.tabs, InspectionTab.allCases)
        XCTAssertEqual(RootShellView.tabs.count, 4)
    }
}
