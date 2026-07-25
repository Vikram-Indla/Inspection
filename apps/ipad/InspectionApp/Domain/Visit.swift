import Foundation

struct Visit: Identifiable, Equatable {
    let id: UUID
    let factoryId: UUID
    let visitType: String
    let executionMode: ExecutionMode
    let planningStatus: PlanningStatus
    let operationalState: OperationalState
    let windowStart: Date
    let windowEnd: Date
    let executionDate: String?
    let priority: String?
}

struct VisitListItem: Identifiable, Equatable {
    var id: UUID { visit.id }
    let visit: Visit
    let factory: Factory?
    let inspectionLifecycle: InspectionLifecycle?
}
