import Foundation
import Supabase

protocol VisitRepository {
    func fetchAssignedVisits() async throws -> [VisitListItem]
}

final class SupabaseVisitRepository: VisitRepository {
    private let client: SupabaseClient
    init(client: SupabaseClient = SupabaseClientProvider.shared) { self.client = client }

    func fetchAssignedVisits() async throws -> [VisitListItem] {
        // RLS scopes rows to the signed-in inspector's assigned visits.
        let response = try await client
            .from("visits")
            .select(VisitRow.selectClause)
            .order("window_start", ascending: true)
            .execute()
        let rows = try VisitRow.decoder().decode([VisitRow].self, from: response.data)
        return rows.compactMap { $0.toListItem() }
    }
}
