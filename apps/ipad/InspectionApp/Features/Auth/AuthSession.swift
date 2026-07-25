import Foundation

enum AuthState: Equatable { case checking, signedOut, signedIn }

@MainActor
final class AuthSession: ObservableObject {
    @Published private(set) var state: AuthState = .checking
    @Published var errorMessage: String?

    private let repository: AuthRepository

    init(repository: AuthRepository = SupabaseAuthRepository()) {
        self.repository = repository
    }

    func restore() async {
        state = await repository.hasValidSession() ? .signedIn : .signedOut
    }

    func signIn(email: String, password: String) async {
        errorMessage = nil
        do {
            try await repository.signIn(email: email, password: password)
            state = .signedIn
        } catch {
            errorMessage = error.localizedDescription
            state = .signedOut
        }
    }

    func signOut() async {
        await repository.signOut()
        state = .signedOut
    }
}
