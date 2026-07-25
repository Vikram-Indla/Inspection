import Foundation

@MainActor
final class DashboardStore: ObservableObject {
    @Published private(set) var kpis: DashboardKPIs = .empty
    @Published private(set) var attention: [VisitListItem] = []
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let repository: VisitRepository
    private let todayProvider: () -> String

    init(repository: VisitRepository = SupabaseVisitRepository(),
         todayProvider: @escaping () -> String = DashboardStore.riyadhToday) {
        self.repository = repository
        self.todayProvider = todayProvider
    }

    func load() async {
        isLoading = true; errorMessage = nil
        defer { isLoading = false }
        do {
            let items = try await repository.fetchAssignedVisits()
            let today = todayProvider()
            kpis = DashboardKPIs.compute(from: items, todayISODate: today)
            attention = DashboardKPIs.attentionItems(from: items)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    static func riyadhToday() -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Riyadh") ?? .current
        let c = cal.dateComponents([.year, .month, .day], from: Date())
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }
}
