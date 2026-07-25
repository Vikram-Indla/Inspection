import Foundation

@MainActor
final class ProfileStore: ObservableObject {
    @Published private(set) var identity: InspectorIdentity?
    @Published var errorMessage: String?

    private let repository: ProfileRepository
    init(repository: ProfileRepository = SupabaseProfileRepository()) { self.repository = repository }

    func load() async {
        do { identity = try await repository.currentProfile() }
        catch { errorMessage = error.localizedDescription }
    }
}
