import Foundation

struct Factory: Identifiable, Equatable, Hashable {
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
}
