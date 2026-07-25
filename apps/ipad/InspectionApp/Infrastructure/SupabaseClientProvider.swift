import Foundation
import Supabase

enum SupabaseClientProvider {
    static let shared = SupabaseClient(
        supabaseURL: AppSecrets.supabaseURL,
        supabaseKey: AppSecrets.supabaseAnonKey
    )
}
