// SubmissionSnapshotTests.swift
// TDD tests for pure snapshot + acknowledgement builders — Task 10.
// These test ONLY the pure static functions; no live store required.

import XCTest
@testable import InspectionApp

// MARK: - SubmissionSnapshotTests

final class SubmissionSnapshotTests: XCTestCase {

    // MARK: - Helpers

    private func makeItem(id: UUID, code: String, requirement: String = "required") -> InspectionItemDef {
        InspectionItemDef(
            id: id,
            code: code,
            title: "Test item \(code)",
            responseModel: ResponseModel(
                responses: ["compliant", "non_compliant", "na"],
                mapping: nil,
                conditional: nil,
                requirement: requirement
            ),
            evidenceRule: nil,
            guidanceEn: nil,
            guidanceAr: nil
        )
    }

    // MARK: - buildSnapshot: answers keyed by item CODE, not UUID

    func test_buildSnapshot_keysAnswersByItemCode() {
        let id1 = UUID(uuidString: "aaaa0000-0000-0000-0000-000000000001")!
        let id2 = UUID(uuidString: "bbbb0000-0000-0000-0000-000000000002")!
        let item1 = makeItem(id: id1, code: "CD-001")
        let item2 = makeItem(id: id2, code: "CD-002")

        let answers: [String: Answer] = [
            id1.uuidString: Answer(value: "compliant", note: nil, date: nil),
            id2.uuidString: Answer(value: "non_compliant", note: "crack in wall", date: "2026-07-26")
        ]

        let snapshot = SnapshotBuilder.buildSnapshot(
            inspectionId: "test-inspection-001",
            answers: answers,
            items: [item1, item2],
            capturedAt: "2026-07-26T10:00:00Z"
        )

        guard case .object(let root) = snapshot,
              case .object(let answersMap) = root["answers"] else {
            XCTFail("Snapshot should be an object with an 'answers' object")
            return
        }

        // Must be keyed by CODE ("CD-001"), not UUID
        XCTAssertNotNil(answersMap["CD-001"], "answers should contain key 'CD-001'")
        XCTAssertNotNil(answersMap["CD-002"], "answers should contain key 'CD-002'")

        // Must NOT be keyed by raw UUID
        XCTAssertNil(answersMap[id1.uuidString], "answers must NOT be keyed by UUID string")
        XCTAssertNil(answersMap[id2.uuidString], "answers must NOT be keyed by UUID string")
    }

    func test_buildSnapshot_includesValueForAnsweredItem() {
        let id1 = UUID(uuidString: "aaaa0000-0000-0000-0000-000000000001")!
        let item1 = makeItem(id: id1, code: "CD-001")
        let answers: [String: Answer] = [
            id1.uuidString: Answer(value: "compliant", note: nil, date: nil)
        ]

        let snapshot = SnapshotBuilder.buildSnapshot(
            inspectionId: "test-inspection-001",
            answers: answers,
            items: [item1],
            capturedAt: "2026-07-26T10:00:00Z"
        )

        guard case .object(let root) = snapshot,
              case .object(let answersMap) = root["answers"],
              case .object(let cd001) = answersMap["CD-001"] else {
            XCTFail("Expected answers.CD-001 to be an object")
            return
        }

        XCTAssertEqual(cd001["value"], .string("compliant"))
    }

    func test_buildSnapshot_includesNoteAndDateWhenSet() {
        let id2 = UUID(uuidString: "bbbb0000-0000-0000-0000-000000000002")!
        let item2 = makeItem(id: id2, code: "CD-002")
        let answers: [String: Answer] = [
            id2.uuidString: Answer(value: "non_compliant", note: "crack in wall", date: "2026-07-26")
        ]

        let snapshot = SnapshotBuilder.buildSnapshot(
            inspectionId: "test-inspection-001",
            answers: answers,
            items: [item2],
            capturedAt: "2026-07-26T10:00:00Z"
        )

        guard case .object(let root) = snapshot,
              case .object(let answersMap) = root["answers"],
              case .object(let cd002) = answersMap["CD-002"] else {
            XCTFail("Expected answers.CD-002 to be an object")
            return
        }

        XCTAssertEqual(cd002["value"], .string("non_compliant"))
        XCTAssertEqual(cd002["note"], .string("crack in wall"))
        XCTAssertEqual(cd002["date"], .string("2026-07-26"))
    }

    func test_buildSnapshot_omitsNoteAndDateWhenNil() {
        let id1 = UUID(uuidString: "aaaa0000-0000-0000-0000-000000000001")!
        let item1 = makeItem(id: id1, code: "CD-001")
        let answers: [String: Answer] = [
            id1.uuidString: Answer(value: "compliant", note: nil, date: nil)
        ]

        let snapshot = SnapshotBuilder.buildSnapshot(
            inspectionId: "test-inspection-001",
            answers: answers,
            items: [item1],
            capturedAt: "2026-07-26T10:00:00Z"
        )

        guard case .object(let root) = snapshot,
              case .object(let answersMap) = root["answers"],
              case .object(let cd001) = answersMap["CD-001"] else {
            XCTFail("Expected answers.CD-001 to be an object")
            return
        }

        XCTAssertNil(cd001["note"], "note should be omitted when nil")
        XCTAssertNil(cd001["date"], "date should be omitted when nil")
    }

    func test_buildSnapshot_includesSubmittedOfflineTrue() {
        let id1 = UUID(uuidString: "aaaa0000-0000-0000-0000-000000000001")!
        let item1 = makeItem(id: id1, code: "CD-001")
        let answers: [String: Answer] = [
            id1.uuidString: Answer(value: "compliant", note: nil, date: nil)
        ]

        let snapshot = SnapshotBuilder.buildSnapshot(
            inspectionId: "test-inspection-001",
            answers: answers,
            items: [item1],
            capturedAt: "2026-07-26T10:00:00Z"
        )

        guard case .object(let root) = snapshot else {
            XCTFail("Snapshot should be an object")
            return
        }

        XCTAssertEqual(root["submitted_offline"], .bool(true))
    }

    func test_buildSnapshot_includesInspectionIdAndCapturedAt() {
        let snapshot = SnapshotBuilder.buildSnapshot(
            inspectionId: "test-inspection-99",
            answers: [:],
            items: [],
            capturedAt: "2026-07-26T10:00:00Z"
        )

        guard case .object(let root) = snapshot else {
            XCTFail("Snapshot should be an object")
            return
        }

        XCTAssertEqual(root["inspectionId"], .string("test-inspection-99"))
        XCTAssertEqual(root["capturedAt"], .string("2026-07-26T10:00:00Z"))
    }

    func test_buildSnapshot_skipsItemsWithNoAnswer() {
        let id1 = UUID(uuidString: "aaaa0000-0000-0000-0000-000000000001")!
        let id2 = UUID(uuidString: "bbbb0000-0000-0000-0000-000000000002")!
        let item1 = makeItem(id: id1, code: "CD-001")
        let item2 = makeItem(id: id2, code: "CD-002")

        // Only item1 is answered
        let answers: [String: Answer] = [
            id1.uuidString: Answer(value: "compliant", note: nil, date: nil)
        ]

        let snapshot = SnapshotBuilder.buildSnapshot(
            inspectionId: "test-inspection-001",
            answers: answers,
            items: [item1, item2],
            capturedAt: "2026-07-26T10:00:00Z"
        )

        guard case .object(let root) = snapshot,
              case .object(let answersMap) = root["answers"] else {
            XCTFail("Expected answers object")
            return
        }

        XCTAssertNotNil(answersMap["CD-001"])
        XCTAssertNil(answersMap["CD-002"], "Items with no answer should be omitted")
    }

    // MARK: - buildAcknowledgement

    func test_buildAcknowledgement_containsName() {
        let ack = SnapshotBuilder.buildAcknowledgement(
            name: "Ahmed Al-Rashidi",
            signedAt: "2026-07-26T10:05:00Z",
            pngBase64: "abc123=="
        )

        guard case .object(let obj) = ack else {
            XCTFail("Acknowledgement should be an object")
            return
        }

        XCTAssertEqual(obj["name"], .string("Ahmed Al-Rashidi"))
    }

    func test_buildAcknowledgement_signedIsTrue() {
        let ack = SnapshotBuilder.buildAcknowledgement(
            name: "Ahmed Al-Rashidi",
            signedAt: "2026-07-26T10:05:00Z",
            pngBase64: "abc123=="
        )

        guard case .object(let obj) = ack else {
            XCTFail("Acknowledgement should be an object")
            return
        }

        XCTAssertEqual(obj["signed"], .bool(true))
    }

    func test_buildAcknowledgement_signedAtIsCorrect() {
        let ack = SnapshotBuilder.buildAcknowledgement(
            name: "Ahmed Al-Rashidi",
            signedAt: "2026-07-26T10:05:00Z",
            pngBase64: "abc123=="
        )

        guard case .object(let obj) = ack else {
            XCTFail("Acknowledgement should be an object")
            return
        }

        XCTAssertEqual(obj["signed_at"], .string("2026-07-26T10:05:00Z"))
    }

    func test_buildAcknowledgement_signatureDataUrlHasDataUrlPrefix() {
        let ack = SnapshotBuilder.buildAcknowledgement(
            name: "Ahmed Al-Rashidi",
            signedAt: "2026-07-26T10:05:00Z",
            pngBase64: "abc123=="
        )

        guard case .object(let obj) = ack,
              case .string(let dataUrl) = obj["signature_data_url"] else {
            XCTFail("Expected signature_data_url string")
            return
        }

        XCTAssertTrue(dataUrl.hasPrefix("data:image/png;base64,"),
                      "signature_data_url should start with 'data:image/png;base64,'")
        XCTAssertTrue(dataUrl.hasSuffix("abc123=="),
                      "signature_data_url should end with the base64 payload")
    }
}
