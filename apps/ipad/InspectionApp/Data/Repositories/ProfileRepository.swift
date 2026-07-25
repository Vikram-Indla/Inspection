import Foundation
import Supabase

struct InspectorIdentity: Equatable {
    let fullName: String
    let email: String?
}

protocol ProfileRepository {
    func currentProfile() async throws -> InspectorIdentity
}

final class SupabaseProfileRepository: ProfileRepository {
    private let client: SupabaseClient
    init(client: SupabaseClient = SupabaseClientProvider.shared) { self.client = client }

    private struct Row: Decodable {
        let fullName: String
        let email: String?
        enum CodingKeys: String, CodingKey { case fullName = "full_name", email }
    }

    func currentProfile() async throws -> InspectorIdentity {
        let uid = try await client.auth.session.user.id
        let response = try await client.from("profiles")
            .select("full_name, email")
            .eq("user_id", value: uid)
            .single()
            .execute()
        let row = try JSONDecoder().decode(Row.self, from: response.data)
        return InspectorIdentity(fullName: row.fullName, email: row.email)
    }
}
