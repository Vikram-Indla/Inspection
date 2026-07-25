import Foundation
import Supabase

protocol VisitRepository {
    func fetchAssignedVisits() async throws -> [VisitListItem]
}

final class SupabaseVisitRepository: VisitRepository {
    private let client: SupabaseClient
    init(client: SupabaseClient = SupabaseClientProvider.shared) { self.client = client }

    func fetchAssignedVisits() async throws -> [VisitListItem] {
        // RLS scopes rows to the signed-in inspector's assigned visits. The
        // per-row RLS check (incl. a SECURITY DEFINER capability function on
        // the shared DB) is ~4s for this dataset; adding an ORDER BY pushes it
        // to ~6s, right at Postgres' statement_timeout. So we take an unordered
        // page cap to stay comfortably under the timeout. Ordered server-side
        // pagination needs a backend RLS/index optimization (follow-up).
        let response = try await client
            .from("visits")
            .select(VisitRow.selectClause)
            .limit(50)
            .execute()
        let rows = try VisitRow.decoder().decode([VisitRow].self, from: response.data)
        return rows.compactMap { $0.toListItem() }
    }
}
