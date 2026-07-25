import Foundation

struct VisitRow: Decodable {
    let id: UUID
    let factoryId: UUID
    let visitType: String
    let executionMode: String
    let planningStatus: String
    let operationalState: String
    let windowStart: Date
    let windowEnd: Date
    let executionDate: String?
    let priority: String?
    let factories: FactoryRow?
    let inspections: [InspectionRow]

    enum CodingKeys: String, CodingKey {
        case id
        case factoryId = "factory_id"
        case visitType = "visit_type"
        case executionMode = "execution_mode"
        case planningStatus = "planning_status"
        case operationalState = "operational_state"
        case windowStart = "window_start"
        case windowEnd = "window_end"
        case executionDate = "execution_date"
        case priority
        case factories
        case inspections
    }

    struct FactoryRow: Decodable {
        let id: UUID
        let name: String
        let factoryCode: String?
        let city: String?
        let region: String?
        let licenseNumber: String?
        let crNumber: String?
        let activityClass: String?
        let riskBand: String?
        let riskScore: Double?
        enum CodingKeys: String, CodingKey {
            case id, name, city, region
            case factoryCode = "factory_code"
            case licenseNumber = "license_number"
            case crNumber = "cr_number"
            case activityClass = "activity_class"
            case riskBand = "risk_band"
            case riskScore = "risk_score"
        }
    }

    struct InspectionRow: Decodable {
        let lifecycleStatus: String
        enum CodingKeys: String, CodingKey { case lifecycleStatus = "lifecycle_status" }
    }

    static let selectClause = "id, factory_id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, execution_date, priority, factories(id, name, factory_code, city, region, license_number, cr_number, activity_class, risk_band, risk_score), inspections(lifecycle_status)"

    /// A JSONDecoder configured like the Supabase client (ISO8601 with fractional seconds).
    static func decoder() -> JSONDecoder {
        let d = JSONDecoder()
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        d.dateDecodingStrategy = .custom { decoder in
            let s = try decoder.singleValueContainer().decode(String.self)
            if let date = iso.date(from: s) { return date }
            let iso2 = ISO8601DateFormatter(); iso2.formatOptions = [.withInternetDateTime]
            if let date = iso2.date(from: s) { return date }
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath,
                                                    debugDescription: "Bad date \(s)"))
        }
        return d
    }

    func toListItem() -> VisitListItem? {
        guard let mode = ExecutionMode.from(executionMode),
              let plan = PlanningStatus.from(planningStatus),
              let state = OperationalState.from(operationalState) else { return nil }
        let visit = Visit(id: id, factoryId: factoryId, visitType: visitType,
                          executionMode: mode, planningStatus: plan, operationalState: state,
                          windowStart: windowStart, windowEnd: windowEnd,
                          executionDate: executionDate, priority: priority)
        let factory = factories.map {
            Factory(id: $0.id, name: $0.name, factoryCode: $0.factoryCode, city: $0.city,
                    region: $0.region, licenseNumber: $0.licenseNumber, crNumber: $0.crNumber,
                    activityClass: $0.activityClass, riskBand: $0.riskBand, riskScore: $0.riskScore)
        }
        let lifecycle = inspections.first.flatMap { InspectionLifecycle.from($0.lifecycleStatus) }
        return VisitListItem(visit: visit, factory: factory, inspectionLifecycle: lifecycle)
    }
}
