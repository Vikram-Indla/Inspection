import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export const supabaseServer = cache(async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* server component render — middleware handles refresh */ }
        },
      },
    }
  );
});

/**
 * Verify the access token once per server render. Admin route boundaries, pages,
 * and the shared shell all need the same trusted user; React's request cache keeps
 * those checks fail-closed without tripling calls to Supabase Auth.
 */
export const getServerUser = cache(async () => {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getClaims();
  const claims = data?.claims;
  return {
    data: {
      user: claims?.sub
        ? { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null }
        : null,
    },
    error,
  };
});
