import Foundation
import Supabase

enum SupabaseClientProvider {
    static let shared: SupabaseClient = {
        // Debug/unsigned builds: Keychain writes fail without an entitlement,
        // so the session wouldn't persist across launches. Use UserDefaults.
        // Signed release builds use the SDK's secure Keychain storage.
        #if DEBUG
        let storage: any AuthLocalStorage = UserDefaultsAuthStorage()
        #else
        let storage: any AuthLocalStorage = KeychainLocalStorage()
        #endif

        return SupabaseClient(
            supabaseURL: AppSecrets.supabaseURL,
            supabaseKey: AppSecrets.supabaseAnonKey,
            options: SupabaseClientOptions(
                auth: SupabaseClientOptions.AuthOptions(
                    storage: storage,
                    autoRefreshToken: true,
                    emitLocalSessionAsInitialSession: true
                )
            )
        )
    }()
}
