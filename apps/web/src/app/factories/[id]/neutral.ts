// CD-031 / HANDOFF_BLOCKED_ERRORMAP — provider/database failures are logged
// server-side and reduced to neutral, user-safe copy. RLS and the underlying
// authority are unchanged; only the visible error contract is sanitized.
type AnyErr = { message?: string; code?: string } | null | undefined;

export type FactoryErrorKind = "load" | "update";

export function mapFactoryError(err: AnyErr, kind: FactoryErrorKind): string {
  const code = err?.code ?? "";
  const raw = (err?.message ?? "").toLowerCase();
  const rls = code === "42501" || raw.includes("row-level security") || raw.includes("permission denied") || raw.includes("not authorized");
  const notFound = code === "PGRST116" || raw.includes("no rows");
  const conflict = code === "23505" || raw.includes("duplicate key") || raw.includes("conflict");

  if (rls) return "You don't have permission for this in your current role, so nothing was changed.";
  if (notFound) return "This factory is no longer in your scope, or it does not exist.";
  if (conflict) return "That change conflicts with an existing record; nothing was changed.";
  return kind === "load"
    ? "This factory's data could not be loaded right now. Nothing was changed — reload to retry."
    : "The change could not be completed. Nothing was modified — reload and try again.";
}

export function logFactoryError(scope: string, err: AnyErr): void {
  if (err) console.error(`[factory360 ${scope}]`, err);
}
