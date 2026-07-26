// EvidenceOpBuildTests.swift
// TDD tests for EvidenceCapture.makeEvidenceOp — Task 9.
// Tests use fixed bytes so SHA256 / name are fully deterministic.
//
// Expected SHA256 of Data([0x01, 0x02, 0x03]):
//   SHA256(0x01 0x02 0x03) = 039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81

import XCTest
import CryptoKit
@testable import InspectionApp

final class EvidenceOpBuildTests: XCTestCase {

    // MARK: - Fixed test data

    /// Three deterministic bytes.  SHA256 is computed once below and asserted.
    private let fixedBytes: Data = Data([0x01, 0x02, 0x03])

    /// Known SHA256 hex for [0x01, 0x02, 0x03]
    private let expectedSHA256 = "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81"

    private let fixedItemId   = "item-abc123"
    private let fixedCapturedAt = "2026-07-26T09:00:00Z"

    // MARK: - Test: sha256 is correct

    func test_makeEvidenceOp_sha256MatchesKnownValue() {
        let op = EvidenceCapture.makeEvidenceOp(
            inspectionId: "insp-001",
            visitId: "visit-001",
            itemId: fixedItemId,
            imageData: fixedBytes,
            capturedAt: fixedCapturedAt
        )
        XCTAssertEqual(op.sha256, expectedSHA256,
            "sha256 must equal the known SHA256 of the fixed bytes")
    }

    // MARK: - Test: name is itemId + first 8 hex chars + .jpg

    func test_makeEvidenceOp_nameIsStableAndCorrect() {
        let op = EvidenceCapture.makeEvidenceOp(
            inspectionId: "insp-001",
            visitId: "visit-001",
            itemId: fixedItemId,
            imageData: fixedBytes,
            capturedAt: fixedCapturedAt
        )
        let sha8 = String(expectedSHA256.prefix(8))
        let expectedName = "\(fixedItemId)-\(sha8).jpg"
        XCTAssertEqual(op.name, expectedName)
    }

    // MARK: - Test: linkedType and evidenceType

    func test_makeEvidenceOp_linkedTypeIsItem() {
        let op = EvidenceCapture.makeEvidenceOp(
            inspectionId: nil,
            visitId: nil,
            itemId: fixedItemId,
            imageData: fixedBytes,
            capturedAt: fixedCapturedAt
        )
        XCTAssertEqual(op.linkedType, "item")
    }

    func test_makeEvidenceOp_linkedIdIsItemId() {
        let op = EvidenceCapture.makeEvidenceOp(
            inspectionId: nil,
            visitId: nil,
            itemId: fixedItemId,
            imageData: fixedBytes,
            capturedAt: fixedCapturedAt
        )
        XCTAssertEqual(op.linkedId, fixedItemId)
    }

    func test_makeEvidenceOp_evidenceTypeIsPhoto() {
        let op = EvidenceCapture.makeEvidenceOp(
            inspectionId: nil,
            visitId: nil,
            itemId: fixedItemId,
            imageData: fixedBytes,
            capturedAt: fixedCapturedAt
        )
        XCTAssertEqual(op.evidenceType, "photo")
    }

    // MARK: - Test: mime

    func test_makeEvidenceOp_mimeIsImageJpeg() {
        let op = EvidenceCapture.makeEvidenceOp(
            inspectionId: nil,
            visitId: nil,
            itemId: fixedItemId,
            imageData: fixedBytes,
            capturedAt: fixedCapturedAt
        )
        XCTAssertEqual(op.mime, "image/jpeg")
    }

    // MARK: - Test: dataB64 round-trips back to original bytes

    func test_makeEvidenceOp_dataB64RoundTrips() {
        let op = EvidenceCapture.makeEvidenceOp(
            inspectionId: "insp-001",
            visitId: "visit-001",
            itemId: fixedItemId,
            imageData: fixedBytes,
            capturedAt: fixedCapturedAt
        )
        XCTAssertFalse(op.dataB64.isEmpty, "dataB64 must not be empty")
        let decoded = Data(base64Encoded: op.dataB64)
        XCTAssertEqual(decoded, fixedBytes, "dataB64 must decode back to the original bytes")
    }

    // MARK: - Test: inspectionId and visitId are forwarded

    func test_makeEvidenceOp_forwardsInspectionAndVisitId() {
        let op = EvidenceCapture.makeEvidenceOp(
            inspectionId: "insp-abc",
            visitId: "visit-xyz",
            itemId: fixedItemId,
            imageData: fixedBytes,
            capturedAt: fixedCapturedAt
        )
        XCTAssertEqual(op.inspectionId, "insp-abc")
        XCTAssertEqual(op.visitId, "visit-xyz")
    }

    // MARK: - Test: capturedAt and queuedAt match the provided value

    func test_makeEvidenceOp_capturedAtAndQueuedAtMatchInput() {
        let op = EvidenceCapture.makeEvidenceOp(
            inspectionId: nil,
            visitId: nil,
            itemId: fixedItemId,
            imageData: fixedBytes,
            capturedAt: fixedCapturedAt
        )
        XCTAssertEqual(op.capturedAt, fixedCapturedAt)
        XCTAssertEqual(op.queuedAt, fixedCapturedAt)
    }

    // MARK: - Test: deterministic — same input yields same output

    func test_makeEvidenceOp_isDeterministicForFixedInput() {
        let op1 = EvidenceCapture.makeEvidenceOp(
            inspectionId: "insp-001",
            visitId: "visit-001",
            itemId: fixedItemId,
            imageData: fixedBytes,
            capturedAt: fixedCapturedAt
        )
        let op2 = EvidenceCapture.makeEvidenceOp(
            inspectionId: "insp-001",
            visitId: "visit-001",
            itemId: fixedItemId,
            imageData: fixedBytes,
            capturedAt: fixedCapturedAt
        )
        XCTAssertEqual(op1, op2, "makeEvidenceOp must be deterministic for fixed inputs")
    }
}
