import { createBrowserClient, type SupabaseClient } from "@supabase/ssr";

// K-008 — module-level singleton. Every caller previously constructed a fresh
// client per component mount, and each instance fetched the Auth JWKS
// independently (Phase-2 evidence: duplicate /auth/v1/.well-known/jwks.json
// requests on cold mounts). One shared client caches JWKS and the session
// subscription once per browser session. Only imported by client components.
let client: SupabaseClient | null = null;

export function supabaseBrowser() {
  client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
}
