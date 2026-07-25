import Foundation
import Supabase

protocol AuthRepository {
    func hasValidSession() async -> Bool
    func signIn(email: String, password: String) async throws
    func signOut() async
}

final class SupabaseAuthRepository: AuthRepository {
    private let client: SupabaseClient

    init(client: SupabaseClient = SupabaseClientProvider.shared) {
        self.client = client
    }

    func hasValidSession() async -> Bool {
        (try? await client.auth.session) != nil
    }

    func signIn(email: String, password: String) async throws {
        _ = try await client.auth.signIn(email: email, password: password)
    }

    func signOut() async {
        try? await client.auth.signOut()
    }
}
