import XCTest
@testable import InspectionApp

final class VisitEnumsTests: XCTestCase {
    func test_executionModeParsesKnownValues() {
        XCTAssertEqual(ExecutionMode.from("physical"), .physical)
        XCTAssertEqual(ExecutionMode.from("virtual"), .virtual)
        XCTAssertTrue(ExecutionMode.virtual.isVirtual)
        XCTAssertFalse(ExecutionMode.physical.isVirtual)
    }

    func test_unknownEnumValueReturnsNilNotCrash() {
        XCTAssertNil(PlanningStatus.from("banana"))
        XCTAssertNil(OperationalState.from(nil))
        XCTAssertNil(InspectionLifecycle.from("weird"))
    }

    func test_operationalStateUnderscoreValues() {
        XCTAssertEqual(OperationalState.from("on_the_way"), .on_the_way)
        XCTAssertEqual(OperationalState.from("under_review"), .under_review)
    }
}
