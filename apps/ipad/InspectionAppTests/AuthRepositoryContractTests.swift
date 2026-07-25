import XCTest
@testable import InspectionApp

final class AuthRepositoryContractTests: XCTestCase {
    func test_stubSignInRecordsCredentialsAndOpensSession() async throws {
        let repo = StubAuthRepository()
        try await repo.signIn(email: "a@b.com", password: "pw")
        let valid = await repo.hasValidSession()
        XCTAssertTrue(valid)
        XCTAssertEqual(repo.signInCalls.first?.email, "a@b.com")
    }

    func test_stubSignOutClosesSession() async {
        let repo = StubAuthRepository()
        repo.validSession = true
        await repo.signOut()
        let valid = await repo.hasValidSession()
        XCTAssertFalse(valid)
    }
}
