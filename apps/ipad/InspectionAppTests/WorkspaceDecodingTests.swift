import XCTest
@testable import InspectionApp

final class WorkspaceDecodingTests: XCTestCase {

    // Representative package_versions row with embedded inspection_items.
    // definition.sections contains item codes; item_rules maps codes to item ids.
    let packageVersionJSON = """
    {
      "id": "aaaa0000-0000-0000-0000-000000000001",
      "version_label": "v1.0",
      "definition": {
        "sections": [
          {
            "key": "fire_safety",
            "title_en": "Fire Safety",
            "title_ar": "سلامة الحريق",
            "items": ["FS-001", "FS-002"]
          }
        ],
        "item_rules": {
          "FS-001": {"requirement": "required"},
          "FS-002": {"requirement": "optional"}
        }
      },
      "packages": null
    }
    """.data(using: .utf8)!

    let itemRowJSON = """
    {
      "id": "bbbb0000-0000-0000-0000-000000000001",
      "code": "FS-001",
      "title": "Fire extinguisher present",
      "guidance_en": "Check that extinguisher is in place.",
      "guidance_ar": "تحقق من وجود الطفاية.",
      "response_model": {
        "responses": ["compliant", "non_compliant", "na"],
        "mapping": {"compliant": 1, "non_compliant": 0, "na": null},
        "requirement": "mandatory"
      },
      "evidence_rule": {
        "on": "non_compliant",
        "type": "photo",
        "min": 1,
        "mandatory": true
      }
    }
    """.data(using: .utf8)!

    let responseRowJSON = """
    {
      "item_id": "bbbb0000-0000-0000-0000-000000000001",
      "response": {"value": "compliant", "note": null, "date": null},
      "updated_at": "2026-07-25T10:30:45.22+00:00"
    }
    """.data(using: .utf8)!

    let inspectionHeadJSON = """
    {
      "id": "cccc0000-0000-0000-0000-000000000001",
      "status": "in_progress",
      "visit_id": "dddd0000-0000-0000-0000-000000000001",
      "package_versions": {
        "id": "aaaa0000-0000-0000-0000-000000000001",
        "version_label": "v1.0",
        "definition": {
          "sections": [
            {
              "key": "fire_safety",
              "title_en": "Fire Safety",
              "title_ar": "سلامة الحريق",
              "items": ["FS-001"]
            }
          ],
          "item_rules": {
            "FS-001": {"requirement": "required"}
          }
        },
        "packages": null
      }
    }
    """.data(using: .utf8)!

    // MARK: - PackageVersionRow

    func test_decodesPackageVersionRow() throws {
        let decoder = JSONDecoder()
        let row = try decoder.decode(PackageVersionRow.self, from: packageVersionJSON)
        XCTAssertEqual(row.id.uuidString.lowercased(), "aaaa0000-0000-0000-0000-000000000001")
        XCTAssertEqual(row.versionLabel, "v1.0")
        XCTAssertEqual(row.definition.sections.count, 1)
        let section = row.definition.sections[0]
        XCTAssertEqual(section.key, "fire_safety")
        XCTAssertEqual(section.titleEn, "Fire Safety")
        XCTAssertEqual(section.titleAr, "سلامة الحريق")
        XCTAssertEqual(section.items, ["FS-001", "FS-002"])
    }

    // MARK: - ItemRow + toDomain()

    func test_decodesItemRowAndMapsToInspectionItemDef() throws {
        let decoder = JSONDecoder()
        let row = try decoder.decode(ItemRow.self, from: itemRowJSON)
        XCTAssertEqual(row.code, "FS-001")
        XCTAssertEqual(row.title, "Fire extinguisher present")
        XCTAssertEqual(row.responseModel.responses, ["compliant", "non_compliant", "na"])
        XCTAssertEqual(row.responseModel.requirement, "mandatory")
        // mapping is kept as JSONValue? — we don't assert its shape
        let rule = try XCTUnwrap(row.evidenceRule)
        XCTAssertEqual(rule.on, "non_compliant")
        XCTAssertEqual(rule.type, "photo")
        XCTAssertEqual(rule.min, 1)
        XCTAssertEqual(rule.mandatory, true)

        let def = row.toDomain()
        XCTAssertEqual(def.code, "FS-001")
        XCTAssertEqual(def.title, "Fire extinguisher present")
        XCTAssertEqual(def.responseModel.responses, ["compliant", "non_compliant", "na"])
        XCTAssertEqual(def.guidanceEn, "Check that extinguisher is in place.")
        XCTAssertEqual(def.guidanceAr, "تحقق من وجود الطفاية.")
        let defRule = try XCTUnwrap(def.evidenceRule)
        XCTAssertEqual(defRule.on, "non_compliant")
        XCTAssertEqual(defRule.type, "photo")
        XCTAssertEqual(defRule.min, 1)
        XCTAssertEqual(defRule.mandatory, true)
    }

    // MARK: - ResponseRow (timestamp with mixed fractional-second precision)

    func test_decodesResponseRowWithFractionalTimestamp() throws {
        let row = try WorkspaceRows.decoder().decode(ResponseRow.self, from: responseRowJSON)
        XCTAssertEqual(row.itemId.uuidString.lowercased(), "bbbb0000-0000-0000-0000-000000000001")
        XCTAssertEqual(row.response?.value, "compliant")
        XCTAssertEqual(row.updatedAt, "2026-07-25T10:30:45.22+00:00")
    }

    func test_decodesResponseRowTimestampVariations() throws {
        for stamp in ["2026-07-25T10:30:45.225+00:00",
                      "2026-07-25T10:30:45.22+00:00",
                      "2026-07-25T10:30:45+00:00"] {
            let json = """
            {
              "item_id": "bbbb0000-0000-0000-0000-000000000001",
              "response": null,
              "updated_at": "\(stamp)"
            }
            """.data(using: .utf8)!
            let row = try WorkspaceRows.decoder().decode(ResponseRow.self, from: json)
            XCTAssertEqual(row.updatedAt, stamp, "should decode stamp \(stamp)")
        }
    }

    // MARK: - InspectionHeadRow

    func test_decodesInspectionHeadRow() throws {
        let decoder = JSONDecoder()
        let row = try decoder.decode(InspectionHeadRow.self, from: inspectionHeadJSON)
        XCTAssertEqual(row.id.uuidString.lowercased(), "cccc0000-0000-0000-0000-000000000001")
        XCTAssertEqual(row.status, "in_progress")
        XCTAssertEqual(row.visitId.uuidString.lowercased(), "dddd0000-0000-0000-0000-000000000001")
        XCTAssertEqual(row.packageVersions.versionLabel, "v1.0")
        XCTAssertEqual(row.packageVersions.definition.sections.first?.key, "fire_safety")
    }
}
