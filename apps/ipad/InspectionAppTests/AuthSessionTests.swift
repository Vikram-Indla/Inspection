import XCTest
@testable import InspectionApp

@MainActor
final class AuthSessionTests: XCTestCase {
    func test_restoreWithValidSessionMovesToSignedIn() async {
        let repo = StubAuthRepository(); repo.validSession = true
        let session = AuthSession(repository: repo)
        await session.restore()
        XCTAssertEqual(session.state, .signedIn)
    }

    func test_restoreWithoutSessionMovesToSignedOut() async {
        let session = AuthSession(repository: StubAuthRepository())
        await session.restore()
        XCTAssertEqual(session.state, .signedOut)
    }

    func test_signInSuccessMovesToSignedIn() async {
        let session = AuthSession(repository: StubAuthRepository())
        await session.signIn(email: "a@b.com", password: "pw")
        XCTAssertEqual(session.state, .signedIn)
        XCTAssertNil(session.errorMessage)
    }

    func test_signInFailureSetsErrorAndStaysSignedOut() async {
        let repo = StubAuthRepository()
        repo.signInError = NSError(domain: "auth", code: 401,
                                   userInfo: [NSLocalizedDescriptionKey: "Invalid login"])
        let session = AuthSession(repository: repo)
        await session.signIn(email: "a@b.com", password: "bad")
        XCTAssertEqual(session.state, .signedOut)
        XCTAssertEqual(session.errorMessage, "Invalid login")
    }
}
