// ChecklistItemLogicTests.swift
// TDD tests for ResponseControlKind.control(for:) — Task 8.
// Pure logic: no views, no stores, no simulators needed.

import XCTest
@testable import InspectionApp

final class ChecklistItemLogicTests: XCTestCase {

    // MARK: - Fixtures

    /// Builds a minimal InspectionItemDef with the given response model params.
    private func makeItem(
        id: UUID = UUID(),
        code: String = "FS-001",
        responses: [String]? = nil,
        requirement: String? = nil
    ) -> InspectionItemDef {
        InspectionItemDef(
            id: id,
            code: code,
            title: "Sample item",
            responseModel: ResponseModel(
                responses: responses,
                mapping: nil,
                conditional: nil,
                requirement: requirement
            ),
            evidenceRule: nil,
            guidanceEn: nil,
            guidanceAr: nil
        )
    }

    // MARK: - Choice

    func test_choiceItem_returnsChoiceControlWithOptions() {
        // A choice item has non-empty responses list.
        let item = makeItem(responses: ["compliant", "non_compliant", "na"])

        let kind = ResponseControlKind.control(for: item)

        XCTAssertEqual(kind, .choice(["compliant", "non_compliant", "na"]))
    }

    func test_singleOptionItem_returnsChoiceControl() {
        let item = makeItem(responses: ["yes"])

        let kind = ResponseControlKind.control(for: item)

        XCTAssertEqual(kind, .choice(["yes"]))
    }

    // MARK: - Date

    func test_dateItem_returnsDateControl() {
        // A date item has "value_date" in its responses list.
        let item = makeItem(responses: ["value_date"])

        let kind = ResponseControlKind.control(for: item)

        XCTAssertEqual(kind, .date)
    }

    func test_dateItemAmongMultipleOptions_returnsDateControl() {
        // Even with extra options, presence of "value_date" triggers date control.
        let item = makeItem(responses: ["value_date", "na"])

        let kind = ResponseControlKind.control(for: item)

        XCTAssertEqual(kind, .date)
    }

    // MARK: - Text

    func test_noResponsesItem_returnsTextControl() {
        // nil responses → text entry
        let item = makeItem(responses: nil)

        let kind = ResponseControlKind.control(for: item)

        XCTAssertEqual(kind, .text)
    }

    func test_emptyResponsesItem_returnsTextControl() {
        // empty array → text entry (not a choice list)
        let item = makeItem(responses: [])

        let kind = ResponseControlKind.control(for: item)

        XCTAssertEqual(kind, .text)
    }
}
