import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { groupExceptions, groupCountEqualsSource, type ExceptionSource } from "@/lib/operations/exceptions";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

// TASK-MVP2-M2-09-OPS-INTEL-001 · MVP2-REQ-0120,0124 · CD-047 (exception_board_v1).
// Projection over EXISTING objects — no synthetic rows (group-count == source-count).
const MODES = ["off", "on"] as const;

export default async function ExceptionsPage() {
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_EXCEPTION_BOARD, MODES, "on") !== "on") {
    return (
      <Shell current="/operations" title={t("exc.title", "Exception board")}>
        <NotYetBoundary title={t("exc.title", "Exception board")} consequence={t("exc.off", "The operations exception board is not enabled here.")}
          seam="FEATURE_EXCEPTION_BOARD=off" notAvailableLabel={t("tasks.notYet", "Not available yet")} detailLabel={t("common.whyPrereq", "Why / prerequisites")} />
      </Shell>
    );
  }
  const sb = await supabaseServer();
  const [{ data: cases, error: casesError }, { data: rex, error: riskError }] = await Promise.all([
    sb.from("cases").select("id, status, opened_at").in("status", ["open", "in_progress"]),
    sb.from("risk_exceptions").select("id, status, created_at").eq("status", "open"),
  ]);
  const sources: ExceptionSource[] = [
    ...(cases ?? []).map((c) => ({ id: `case:${c.id}`, category: "correction_overdue" as const, branch: null, ref: c.id, occurredAt: c.opened_at })),
    ...(rex ?? []).map((r) => ({ id: `rex:${r.id}`, category: "review_overdue" as const, branch: null, ref: r.id, occurredAt: r.created_at })),
  ];
  const groups = groupExceptions(sources);
  const invariantOk = groupCountEqualsSource(sources); // must be true — no synthetic rows
  const degraded = Boolean(casesError || riskError);
  return (
    <Shell current="/operations" title={t("exc.title", "Exception board")}>
      <div className="stack" data-saqeel-screen="supervisor-exceptions">
      <header className="page-header">
        <div>
          <h1 className="sr-only">{t("exc.title", "Exception board")}</h1>
          <p className="tl-meta">{t("exc.subtitle", "Operational exceptions filtered to your access, derived from the owning case and risk records.")}</p>
        </div>
        <nav className="row" aria-label={t("exc.journey", "Supervisor operations journey")}>
          <Link className="btn btn-secondary" href="/operations">{t("ops.title", "Operations Center")}</Link>
          <Link className="btn btn-secondary" href="/operations/live">{t("ops.live.title", "Live operations")}</Link>
          <Link className="btn btn-secondary" href="/execution">{t("execution.title", "Execution")}</Link>
          <Link className="btn btn-secondary" href="/reviews">{t("reviews.title", "Review queue")}</Link>
        </nav>
      </header>
      <div className="sq-banner"><div><strong>{t("exc.banner.title", "How this board is built.")}</strong> {t("exc.banner.body", "Exceptions are a projection over real objects — decisions stay on the owning object. Counts trace one-to-one to their sources.")} {invariantOk ? "✓" : "⚠"}</div></div>
      {degraded ? (
        <div className="alert alert-warning" role="status">
          <div><strong>{t("exc.degraded.title", "Exception sources are partially unavailable.")}</strong> {t("exc.degraded.body", "Available groups filtered to your access remain visible; unavailable sources are not represented as zero.")}</div>
        </div>
      ) : null}
      {sources.length === 0 && (
        <EmptyState glyph="—" title={t("exc.empty.title", "No open exceptions in scope")}
          body={degraded
            ? t("exc.empty.degraded", "No source could be verified. Retry after the affected service recovers.")
            : t("exc.empty.body", "Open cases and risk exceptions surface here. Empty may also mean none are in your scope.")} />
      )}
      {groups.map((g) => (
        <div key={g.category} className="panel">
          <div className="panel-row">
            <div>
              <h2>{g.category.replace(/_/g, " ")}</h2>
              <p className="tl-meta">{t("exc.group.source", "Open the source record to inspect and decide.")}</p>
            </div>
            <span className="badge badge-warning numeric">{g.count}</span>
            <Link className="btn btn-secondary" href={g.category === "review_overdue" ? "/reviews" : "/execution"}>
              {g.category === "review_overdue" ? t("exc.group.review", "Open review queue") : t("exc.group.execution", "Open execution")}
            </Link>
          </div>
        </div>
      ))}
      </div>
    </Shell>
  );
}
