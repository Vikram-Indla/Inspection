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
        // Recent-first + a page cap: the full assignment set can be large
        // (hundreds+ of visits) and each row runs an RLS subquery, so an
        // unbounded ordered scan hits Postgres' statement_timeout. Real
        // pagination/infinite-scroll lands in a later phase.
        let response = try await client
            .from("visits")
            .select(VisitRow.selectClause)
            .order("window_start", ascending: false)
            .limit(100)
            .execute()
        let rows = try VisitRow.decoder().decode([VisitRow].self, from: response.data)
        return rows.compactMap { $0.toListItem() }
    }
}
