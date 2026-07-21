// CD-027 Track 2 — HANDOFF_BLOCKED_ERRORMAP closure.
// Sanitize raw Supabase / PostgREST / Storage errors into neutral, user-safe
// copy. Never surfaces provider text, SQL, table names, or stack detail. The
// authority is unchanged (RLS still decides); this only governs what the user
// SEES. Known, actionable cases keep a specific-but-neutral message; everything
// else collapses to a generic "nothing was modified" line.
type AnyErr = { message?: string; code?: string } | null | undefined;

export type ErrorKind = "load" | "update" | "upload" | "link" | "notify";

export function mapError(err: AnyErr, kind: ErrorKind): string {
  const code = err?.code ?? "";
  const raw = (err?.message ?? "").toLowerCase();
  const rls = code === "42501" || raw.includes("row-level security") || raw.includes("permission denied") || raw.includes("not authorized");
  const notFound = code === "PGRST116" || raw.includes("no rows");
  const conflict = code === "23505" || raw.includes("duplicate key") || raw.includes("conflict");

  if (rls) return "You don't have permission for this in your current role, so nothing was changed.";
  if (notFound) return "This visit is no longer in your scope, or it does not exist.";
  if (conflict) return "That change conflicts with an existing record; nothing was changed.";

  switch (kind) {
    case "load": return "This visit's data could not be loaded right now. Nothing was changed — reload to retry.";
    case "upload": return "The file could not be attached. Nothing was saved — try the upload again.";
    case "link": return "download link unavailable";
    case "notify": return "the notification could not be queued";
    case "update":
    default: return "The change could not be completed. Nothing was modified — reload and try again.";
  }
}
