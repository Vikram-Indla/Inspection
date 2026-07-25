import XCTest
import Components
@testable import InspectionApp

final class VisitStatusPresentationTests: XCTestCase {
    func test_planningToneMapping() {
        XCTAssertEqual(VisitStatusPresentation.planningTone(.published), .success)
        XCTAssertEqual(VisitStatusPresentation.planningTone(.returned), .warning)
        XCTAssertEqual(VisitStatusPresentation.planningTone(.cancelled), .critical)
        XCTAssertEqual(VisitStatusPresentation.planningTone(.expired), .critical)
        XCTAssertEqual(VisitStatusPresentation.planningTone(.draft), .neutral)
    }

    func test_lifecycleLabelNilIsNotStarted() {
        XCTAssertEqual(VisitStatusPresentation.lifecycleLabel(nil), "Not started")
        XCTAssertEqual(VisitStatusPresentation.lifecycleLabel(.in_progress), "In progress")
        XCTAssertEqual(VisitStatusPresentation.lifecycleLabel(.returned), "Returned")
    }
}
