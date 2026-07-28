import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Elevated, RLS-bypassing, server-only Supabase client.
 *
 * Used ONLY to compute the national-aggregate dashboard KPIs (the "National
 * performance" strategic cards) so a limited role — e.g. an inspector — sees
 * national figures without being granted a leadership role. It never touches
 * per-row user surfaces; the per-user RLS client remains the authority for
 * everything else.
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured, so callers
 * fall back to the per-user RLS client (the original, fully-governed behaviour).
 * The service key is server-only and must never be exposed to the browser.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
