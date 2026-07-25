import XCTest
import Components
@testable import InspectionApp

final class ShellContentTests: XCTestCase {
    func test_liveContentTabsWired() {
        XCTAssertTrue(RootShellView.usesLiveContent(for: .dashboard))
        XCTAssertTrue(RootShellView.usesLiveContent(for: .visits))
        XCTAssertTrue(RootShellView.usesLiveContent(for: .profile))
        XCTAssertFalse(RootShellView.usesLiveContent(for: .virtual)) // Phase 5
    }
}
