import "server-only";

import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

/**
 * Configuration writes are deliberately checked in the application as well as
 * by RLS.  RLS remains authoritative; this guard gives every server action the
 * same fail-closed behaviour and a neutral error that is safe to display.
 */
export async function requireConfigurationWriter(): Promise<
  | { ok: true; userId: string; roles: string[] }
  | { ok: false; message: string }
> {
  const sb = await supabaseServer();
  const { data: { user }, error: userError } = await getVerifiedUser(sb);
  if (userError || !user) return { ok: false, message: "Your session has ended. Sign in again." };

  const { data: rows, error: rolesError } = await getUserRoles(user.id);
  if (rolesError) {
    console.error("[admin configuration roles]", rolesError.message);
    return { ok: false, message: "Your permissions could not be verified. Try again." };
  }

  const roles = Array.from(new Set((rows ?? []).map(row => row.role_key)));
  if (!roles.some(role => role === "admin")) {
    return { ok: false, message: "You do not have permission to change configuration." };
  }
  return { ok: true, userId: user.id, roles };
}

/** Keep provider/database details in server logs, not action responses. */
export function configurationFailure(scope: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[admin configuration ${scope}]`, detail);
  return { error: "The change could not be saved. Review the fields and try again." };
}

/** Server components use this before rendering an unavailable source state. */
export function logConfigurationReadFailure(scope: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[admin configuration ${scope}]`, detail);
}
