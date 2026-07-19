import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { groupExceptions, groupCountEqualsSource, type ExceptionSource } from "@/lib/operations/exceptions";
import EmptyState from "@/components/EmptyState";

// TASK-MVP2-M2-09-OPS-INTEL-001 · MVP2-REQ-0120,0124 · CD-047 (exception_board_v1).
// Projection over EXISTING objects — no synthetic rows (group-count == source-count).
export const dynamic = "force-dynamic";
const MODES = ["off", "on"] as const;

export default async function ExceptionsPage() {
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_EXCEPTION_BOARD, MODES, "off") !== "on") {
    return (
      <Shell current="/operations" title={t("exc.title", "Exception board")} context={<span className="ax-lozenge ax-lozenge--warning">CD-047 · REQ-0120</span>}>
        <NotYetBoundary title={t("exc.title", "Exception board")} consequence={t("exc.off", "The operations exception board is not enabled here.")}
          seam="FEATURE_EXCEPTION_BOARD=off" notAvailableLabel={t("tasks.notYet", "Not available yet")} detailLabel={t("common.whyPrereq", "Why / prerequisites")} />
      </Shell>
    );
  }
  const sb = await supabaseServer();
  const [{ data: cases }, { data: rex }] = await Promise.all([
    sb.from("cases").select("id, status, opened_at").in("status", ["open", "in_progress"]),
    sb.from("risk_exceptions").select("id, status, created_at").eq("status", "open"),
  ]);
  const sources: ExceptionSource[] = [
    ...(cases ?? []).map((c) => ({ id: `case:${c.id}`, category: "correction_overdue" as const, branch: null, ref: c.id, occurredAt: c.opened_at })),
    ...(rex ?? []).map((r) => ({ id: `rex:${r.id}`, category: "review_overdue" as const, branch: null, ref: r.id, occurredAt: r.created_at })),
  ];
  const groups = groupExceptions(sources);
  const invariantOk = groupCountEqualsSource(sources); // must be true — no synthetic rows
  return (
    <Shell current="/operations" title={t("exc.title", "Exception board")} context={<span className="ax-lozenge ax-lozenge--info">CD-047 · REQ-0120,0124</span>}>
      <div className="ax-banner"><div><strong>{t("exc.banner.title", "Command posture.")}</strong> {t("exc.banner.body", "Exceptions are a projection over real objects — decisions stay on the owning object. Counts trace 1:1 to sources (no synthetic rows).")} {invariantOk ? "✓" : "⚠"}</div></div>
      {sources.length === 0 && (
        <EmptyState glyph="✅" title={t("exc.empty.title", "No open exceptions in scope")}
          body={t("exc.empty.body", "Open cases and risk exceptions surface here. Empty may also mean none are in your scope (RLS).")} />
      )}
      {groups.map((g) => (
        <div key={g.category} className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between" }}>
            <h3>{g.category.replace(/_/g, " ")}</h3><span className="ax-lozenge ax-lozenge--warning ax-numeric">{g.count}</span>
          </div>
        </div>
      ))}
    </Shell>
  );
}
