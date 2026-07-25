import XCTest
@testable import InspectionApp

final class VisitRowDecodingTests: XCTestCase {
    // Mirrors a real PostgREST embed response for the visits select.
    let json = """
    [{
      "id": "11111111-1111-1111-1111-111111111111",
      "factory_id": "22222222-2222-2222-2222-222222222222",
      "visit_type": "periodic",
      "execution_mode": "physical",
      "planning_status": "published",
      "operational_state": "new",
      "window_start": "2026-07-25T06:00:00+00:00",
      "window_end": "2026-07-26T06:00:00+00:00",
      "execution_date": "2026-07-25",
      "priority": "high",
      "factories": {
        "id": "22222222-2222-2222-2222-222222222222",
        "name": "Alamal Plastics",
        "factory_code": "F-001",
        "city": "Riyadh",
        "region": "Central",
        "license_number": "LIC-9",
        "cr_number": "CR-9",
        "activity_class": "Plastics",
        "risk_band": "high",
        "risk_score": 82.5
      },
      "inspections": [ { "lifecycle_status": "returned" } ]
    }]
    """.data(using: .utf8)!

    func test_decodesEmbeddedVisitRow() throws {
        let rows = try VisitRow.decoder().decode([VisitRow].self, from: json)
        XCTAssertEqual(rows.count, 1)
        let item = rows[0].toListItem()
        XCTAssertNotNil(item)
        XCTAssertEqual(item?.visit.visitType, "periodic")
        XCTAssertEqual(item?.visit.executionMode, .physical)
        XCTAssertEqual(item?.visit.planningStatus, .published)
        XCTAssertEqual(item?.visit.executionDate, "2026-07-25")
        XCTAssertEqual(item?.factory?.name, "Alamal Plastics")
        XCTAssertEqual(item?.factory?.riskBand, "high")
        XCTAssertEqual(item?.inspectionLifecycle, .returned)
    }

    func test_handlesMissingFactoryAndInspection() throws {
        let minimal = """
        [{ "id":"11111111-1111-1111-1111-111111111111",
           "factory_id":"22222222-2222-2222-2222-222222222222",
           "visit_type":"immediate","execution_mode":"virtual",
           "planning_status":"draft","operational_state":"new",
           "window_start":"2026-07-25T06:00:00+00:00",
           "window_end":"2026-07-26T06:00:00+00:00",
           "execution_date":null,"priority":null,
           "factories":null,"inspections":[] }]
        """.data(using: .utf8)!
        let item = try VisitRow.decoder().decode([VisitRow].self, from: minimal)[0].toListItem()
        XCTAssertNotNil(item)
        XCTAssertNil(item?.factory)
        XCTAssertNil(item?.inspectionLifecycle)
        XCTAssertEqual(item?.visit.executionMode, .virtual)
    }

    // Real Supabase rows carry a mix of fractional-second precisions. The strict
    // ISO8601 parser rejects 2-digit fractions; the decoder must handle all three.
    func test_decodesTimestampsWithVariableFractionalSeconds() throws {
        for stamp in ["2381-08-10T13:13:10.225+00:00",  // 3 digits (ms)
                      "2381-08-10T13:13:10.22+00:00",   // 2 digits
                      "2381-08-10T13:13:10+00:00"] {     // none
            let json = """
            [{ "id":"11111111-1111-1111-1111-111111111111",
               "factory_id":"22222222-2222-2222-2222-222222222222",
               "visit_type":"periodic","execution_mode":"physical",
               "planning_status":"published","operational_state":"new",
               "window_start":"\(stamp)","window_end":"\(stamp)",
               "execution_date":null,"priority":null,
               "factories":null,"inspections":[] }]
            """.data(using: .utf8)!
            let rows = try VisitRow.decoder().decode([VisitRow].self, from: json)
            XCTAssertNotNil(rows.first?.toListItem(), "should decode stamp \(stamp)")
        }
    }
}
