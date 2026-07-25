import Foundation
@testable import InspectionApp

final class StubVisitRepository: VisitRepository {
    var items: [VisitListItem] = []
    var error: Error?
    private(set) var fetchCount = 0
    func fetchAssignedVisits() async throws -> [VisitListItem] {
        fetchCount += 1
        if let error { throw error }
        return items
    }
}
