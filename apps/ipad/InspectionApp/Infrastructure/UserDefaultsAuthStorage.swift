import Foundation
import Supabase

/// Persists the Supabase auth session in `UserDefaults`.
///
/// The SDK's default `KeychainLocalStorage` silently fails to write in
/// unsigned local/dev builds (`CODE_SIGNING_ALLOWED=NO`) because there is no
/// keychain-access entitlement — so the session is never persisted and the
/// user is bounced back to login on every launch. This storage persists the
/// session without an entitlement. Release builds (signed) use the SDK's
/// Keychain storage instead (see `SupabaseClientProvider`).
struct UserDefaultsAuthStorage: AuthLocalStorage {
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) { self.defaults = defaults }

    func store(key: String, value: Data) throws { defaults.set(value, forKey: key) }
    func retrieve(key: String) throws -> Data? { defaults.data(forKey: key) }
    func remove(key: String) throws { defaults.removeObject(forKey: key) }
}
