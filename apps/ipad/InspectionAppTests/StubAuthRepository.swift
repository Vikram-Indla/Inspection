import Foundation
@testable import InspectionApp

final class StubAuthRepository: AuthRepository {
    var validSession = false
    var signInError: Error?
    private(set) var signInCalls: [(email: String, password: String)] = []
    private(set) var signOutCalled = false

    func hasValidSession() async -> Bool { validSession }

    func signIn(email: String, password: String) async throws {
        signInCalls.append((email, password))
        if let signInError { throw signInError }
        validSession = true
    }

    func signOut() async {
        signOutCalled = true
        validSession = false
    }
}
