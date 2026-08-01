import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { groupExceptions, groupCountEqualsSource, type ExceptionSource } from "@/lib/operations/exceptions";
import EmptyState from "@/components/EmptyState";

// TASK-MVP2-M2-09-OPS-INTEL-001 · MVP2-REQ-0120,0124 · CD-047 (exception_board_v1).
// Projection over EXISTING objects — no synthetic rows (group-count == source-count).
const MODES = ["off", "on"] as const;

export default async function ExceptionsPage() {
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_EXCEPTION_BOARD, MODES, "off") !== "on") {
    return (
      <Shell current="/operations" title={t("exc.title", "Exception board")} context={<span className="badge badge-warning">REQ-0120</span>}>
        <NotYetBoundary title={t("exc.title", "Exception board")} consequence={t("exc.off", "This board is not turned on here.")}
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
    <Shell current="/operations" title={t("exc.title", "Exception board")} context={<span className="badge badge-info">REQ-0120,0124</span>}>
      <div className="sq-banner"><div><strong>{t("exc.banner.title", "Live status.")}</strong> {t("exc.banner.body", "This board shows real cases and risk exceptions. Decisions stay on the original record. Every count matches its source — nothing here is made up.")} {invariantOk ? "✓" : "⚠"}</div></div>
      {sources.length === 0 && (
        <EmptyState glyph="✅" title={t("exc.empty.title", "No open exceptions you can see")}
          body={t("exc.empty.body", "Open cases and risk exceptions show up here. If this is empty, it may also mean there are none you're allowed to see.")} />
      )}
      {groups.map((g) => (
        <div key={g.category} className="panel" style={{ padding: "var(--space-6)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3>{g.category.replace(/_/g, " ")}</h3><span className="badge badge-warning numeric">{g.count}</span>
          </div>
        </div>
      ))}
    </Shell>
  );
}
