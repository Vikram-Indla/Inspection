import Foundation
@testable import InspectionApp

final class StubProfileRepository: ProfileRepository {
    var identity = InspectorIdentity(fullName: "Test Inspector", email: "t@mim.gov.sa")
    var error: Error?
    func currentProfile() async throws -> InspectorIdentity {
        if let error { throw error }; return identity
    }
}
