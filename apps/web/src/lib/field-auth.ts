import type { Session, SupabaseClient } from "@supabase/supabase-js";

const KNOWN_INSPECTOR_KEY = "saqeel.field.knownInspector.v1";
const SESSION_MODE_KEY = "saqeel.field.sessionMode.v1";
const SESSION_TAB_KEY = "saqeel.field.sessionTab.v1";

type KnownInspector = { userId: string; verifiedAt: string };
type SessionMode = { userId: string; persistent: boolean };

export type FieldSessionBootstrap =
  | { status: "anonymous" | "expired" | "unauthorized"; session: null }
  | { status: "ready" | "offline_known"; session: Session };

export function safeFieldReturnPath(value: string | null | undefined): string {
  if (!value) return "/field";
  try {
    const decoded = decodeURIComponent(value);
    const url = new URL(decoded, "https://field.invalid");
    const fieldPath = url.pathname === "/field" || url.pathname.startsWith("/field/");
    if (url.origin === "https://field.invalid" && fieldPath) return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    // Invalid or double-encoded input falls back to the field home.
  }
  return "/field";
}

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

export function rememberInspector(userId: string, persistent: boolean): void {
  const known: KnownInspector = { userId, verifiedAt: new Date().toISOString() };
  const mode: SessionMode = { userId, persistent };
  try {
    localStorage.setItem(KNOWN_INSPECTOR_KEY, JSON.stringify(known));
    localStorage.setItem(SESSION_MODE_KEY, JSON.stringify(mode));
    if (persistent) sessionStorage.removeItem(SESSION_TAB_KEY);
    else sessionStorage.setItem(SESSION_TAB_KEY, userId);
  } catch {
    // Storage denial never upgrades authorization.
  }
}

export function clearFieldSessionIdentity(userId?: string): void {
  try {
    const known = readJson<KnownInspector>(localStorage, KNOWN_INSPECTOR_KEY);
    const mode = readJson<SessionMode>(localStorage, SESSION_MODE_KEY);
    if (!userId || known?.userId === userId) localStorage.removeItem(KNOWN_INSPECTOR_KEY);
    if (!userId || mode?.userId === userId) localStorage.removeItem(SESSION_MODE_KEY);
    if (!userId || sessionStorage.getItem(SESSION_TAB_KEY) === userId) sessionStorage.removeItem(SESSION_TAB_KEY);
  } catch {
    // The server session is still signed out by the caller.
  }
}

function isKnownInspector(userId: string): boolean {
  return readJson<KnownInspector>(localStorage, KNOWN_INSPECTOR_KEY)?.userId === userId;
}

function sessionModeAllows(userId: string): boolean {
  const mode = readJson<SessionMode>(localStorage, SESSION_MODE_KEY);
  if (!mode || mode.userId !== userId || mode.persistent) return true;
  return sessionStorage.getItem(SESSION_TAB_KEY) === userId;
}

async function verifyInspectorRole(sb: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await sb.from("user_roles").select("role_key")
    .eq("user_id", userId).eq("role_key", "inspector").limit(1);
  return !error && (data?.length ?? 0) === 1;
}

export async function bootstrapFieldSession(sb: SupabaseClient, online: boolean): Promise<FieldSessionBootstrap> {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return { status: "anonymous", session: null };
  const userId = session.user.id;

  if (!sessionModeAllows(userId)) {
    clearFieldSessionIdentity(userId);
    await sb.auth.signOut({ scope: "local" });
    return { status: "expired", session: null };
  }

  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  const needsRefresh = expiresAtMs <= Date.now() + 60_000;
  if (needsRefresh) {
    if (!online) return { status: "expired", session: null };
    const { data, error } = await sb.auth.refreshSession();
    if (error || !data.session) {
      clearFieldSessionIdentity(userId);
      return { status: "expired", session: null };
    }
    if (!(await verifyInspectorRole(sb, userId))) return { status: "unauthorized", session: null };
    rememberInspector(userId, readJson<SessionMode>(localStorage, SESSION_MODE_KEY)?.persistent ?? true);
    return { status: "ready", session: data.session };
  }

  if (!online) {
    return isKnownInspector(userId)
      ? { status: "offline_known", session }
      : { status: "expired", session: null };
  }

  if (!(await verifyInspectorRole(sb, userId))) return { status: "unauthorized", session: null };
  return { status: "ready", session };
}

export async function authorizeInspectorLogin(
  sb: SupabaseClient,
  session: Session,
  persistent: boolean,
): Promise<boolean> {
  const allowed = await verifyInspectorRole(sb, session.user.id);
  if (allowed) rememberInspector(session.user.id, persistent);
  return allowed;
}
