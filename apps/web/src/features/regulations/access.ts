import { getServerUser, supabaseServer } from "@/lib/supabase-server";

const WRITER_ROLES = ["admin", "compliance_admin", "form_admin"];
const REVIEWER_ROLES = ["supervisor", "reviewer"];

export type RegulationAccess =
  | { readonly kind: "writer" }
  | { readonly kind: "reviewer" }
  | { readonly kind: "reader" }
  | { readonly kind: "unverified" };

/**
 * The route layout already gates who reaches this screen. This read decides
 * only what the screen *says* about writing, and a failed role read is its own
 * state — claiming "read only for your role" when the roles could not be read
 * would assert a permission fact the app does not have.
 */
export async function readRegulationAccess(): Promise<RegulationAccess> {
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();
  if (!user) return { kind: "unverified" };

  const { data, error } = await sb.from("user_roles").select("role_key").eq("user_id", user.id);
  if (error) {
    console.error(`[regulations.access] role read failed: ${error.message}`);
    return { kind: "unverified" };
  }

  const roles = new Set((data ?? []).map(row => row.role_key));
  if (WRITER_ROLES.some(role => roles.has(role))) return { kind: "writer" };
  if (REVIEWER_ROLES.some(role => roles.has(role))) return { kind: "reviewer" };
  return { kind: "reader" };
}
