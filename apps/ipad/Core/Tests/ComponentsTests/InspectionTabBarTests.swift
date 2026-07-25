import XCTest
import DesignSystem
@testable import Components

final class InspectionTabBarTests: XCTestCase {
    func test_fourTabsInOrder() {
        XCTAssertEqual(InspectionTab.allCases,
                       [.dashboard, .visits, .virtual, .profile])
    }

    func test_tabTitlesAndIcons() {
        XCTAssertEqual(InspectionTab.dashboard.title, "Dashboard")
        XCTAssertEqual(InspectionTab.visits.title, "Visits")
        XCTAssertEqual(InspectionTab.virtual.systemImage, "video.fill")
        XCTAssertEqual(InspectionTab.profile.systemImage, "person.crop.circle")
    }

    func test_syncStateUsesSyncDomain() {
        XCTAssertEqual(SyncState.conflict.domain, .sync)
        XCTAssertEqual(SyncState.offline.label, "Offline")
    }
}
