import Foundation

@MainActor
final class VisitsStore: ObservableObject {
    @Published private(set) var all: [VisitListItem] = []
    @Published var filter: VisitFilter = .all
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let repository: VisitRepository
    private let todayProvider: () -> String

    init(repository: VisitRepository = SupabaseVisitRepository(),
         todayProvider: @escaping () -> String = DashboardStore.riyadhToday) {
        self.repository = repository
        self.todayProvider = todayProvider
    }

    var visible: [VisitListItem] { filter.apply(to: all, todayISODate: todayProvider()) }

    func count(for filter: VisitFilter) -> Int {
        filter.apply(to: all, todayISODate: todayProvider()).count
    }

    func load() async {
        isLoading = true; errorMessage = nil
        defer { isLoading = false }
        do { all = try await repository.fetchAssignedVisits() }
        catch { errorMessage = error.localizedDescription }
    }
}
