import { supabaseBrowser } from "./supabase";

// SCR-PUB-010 · ENG-12 · FND-003 — client side of the auth audit event.
// The email is hashed in the browser (sha256 hex) so raw addresses never reach
// the audit trail; the server RPC (migration 0022) appends the append-only row.
export type AuthAuditAction = "password_reset_requested" | "password_reset_completed";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Record a password-reset audit event. Best-effort by contract: auditing must
 * never block or break the reset UX, so failures (including the RPC not yet
 * being deployed) are swallowed. The append and its integrity live server-side.
 */
export async function logAuthEvent(action: AuthAuditAction, email: string): Promise<void> {
  try {
    const p_email_hash = await sha256Hex(email);
    await supabaseBrowser().rpc("log_auth_event", { p_email_hash, p_action: action });
  } catch {
    /* audit is non-blocking; never surface to the user */
  }
}
