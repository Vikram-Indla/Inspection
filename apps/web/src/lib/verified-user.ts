import type { SupabaseClient } from "@supabase/supabase-js";

// Establish identity from a cryptographically verified access-token claim.
// This project uses asymmetric JWT signing, so getClaims verifies locally
// (with cached JWKS) instead of consuming the Auth /user rate limit on every
// Server Component, Server Action, notification poll and offline replay.
export async function getVerifiedUser(sb: SupabaseClient) {
  const { data, error } = await sb.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { data: { user: null }, error };
  return {
    data: {
      user: {
        id: claims.sub,
        email: typeof claims.email === "string" ? claims.email : null,
      },
    },
    error: null,
  };
}
