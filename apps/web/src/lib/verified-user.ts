import type { SupabaseClient } from "@supabase/supabase-js";

// Establish identity from a cryptographically verified access-token claim.
// This project uses asymmetric JWT signing, so getClaims verifies locally
// (with cached JWKS) instead of consuming the Auth /user rate limit on every
// Server Component, Server Action, notification poll and offline replay.
export async function getVerifiedUser(sb: SupabaseClient) {
  let result: Awaited<ReturnType<typeof sb.auth.getClaims>>;
  try {
    result = await sb.auth.getClaims();
  } catch (firstError) {
    // A cold JWKS fetch can fail transiently in a fresh browser context. Retry
    // once, then return an unauthenticated result instead of leaking an
    // unhandled page error or weakening verification with getSession().
    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      result = await sb.auth.getClaims();
    } catch (retryError) {
      const verificationError = (retryError instanceof Error
        ? retryError
        : firstError instanceof Error
          ? firstError
          : new Error("Identity verification failed")) as Awaited<ReturnType<typeof sb.auth.getClaims>>["error"];
      return {
        data: { user: null },
        error: verificationError,
      };
    }
  }
  const { data, error } = result;
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
