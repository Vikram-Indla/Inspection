import XCTest
@testable import InspectionApp

@MainActor
final class ProfileStoreTests: XCTestCase {
    func test_loadSetsIdentity() async {
        let repo = StubProfileRepository()
        let store = ProfileStore(repository: repo)
        await store.load()
        XCTAssertEqual(store.identity?.fullName, "Test Inspector")
    }
}
