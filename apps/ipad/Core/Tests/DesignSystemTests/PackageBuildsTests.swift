import XCTest
@testable import DesignSystem

final class PackageBuildsTests: XCTestCase {
    func test_designSystemModuleLoads() {
        XCTAssertNotNil(SaqeelColorScheme.light)
    }
}
