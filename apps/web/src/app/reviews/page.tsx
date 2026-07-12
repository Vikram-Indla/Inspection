import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import DecisionPanel, { type DecisionPanelStrings } from "./DecisionPanel";

export const dynamic = "force-dynamic";

const TONE: Record<string, string> = { approved: "ax-lozenge--success", returned: "ax-lozenge--warning", rejected: "ax-lozenge--critical", under_review: "ax-lozenge--info" };

export default async function Reviews({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status: statusFilter = "" } = await searchParams;
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: allReviews } = await sb.from("reviews")
    .select("id, status, decision, decision_reason, returned_sections, decided_at, submission_versions(version_number, submitted_at, acknowledgement), inspections(id, status, visits(factories(name, factory_code)))")
    .order("decided_at", { ascending: false, nullsFirst: true });
  // M06-014/030 — queue search (factory name/code) + status filter, server-side
  // over the RLS-scoped rows.
  const needle = q.trim().toLowerCase();
  const reviews = (allReviews ?? []).filter(r => {
    const fac = (r.inspections as unknown as { visits: { factories: { name: string; factory_code: string } } } | null)?.visits?.factories;
    const hit = !needle || `${fac?.name ?? ""} ${fac?.factory_code ?? ""}`.toLowerCase().includes(needle);
    return hit && (!statusFilter || r.status === statusFilter);
  });
  const pending = reviews.filter(r => { return !r.decided_at; });
  const panelStrings: DecisionPanelStrings = {
    heading: t("review.panel.heading", "Decision — {factory}"),
    awaiting: t("review.panel.awaiting", "awaiting decision"),
    decisions: {
      approve: t("enum.approve", "Approve"),
      return: t("enum.return", "Return"),
      reject: t("enum.reject", "Reject"),
    },
    returnScope: t("review.panel.returnScope", "Return scope — sections, comma-separated (FLD-REV-004)"),
    reason: t("review.panel.reason", "Reason — mandatory (FLD-REV-003)"),
    record: t("review.panel.record", "Record decision (immutable — M06-009)"),
    recording: t("review.panel.recording", "Recording…"),
  };
  return (
    <Shell current="/reviews" title={t("review.list.title", "Level 2 review")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("review.list.context", "SCR-WEB-300/310 · live data from golden slice")}</span>}>
      <form method="get" className="ax-row" style={{ marginBlockEnd: "var(--ax-space-200)" }}>
        <div className="ax-field"><label className="ax-field__label" htmlFor="rev-q">{t("review.list.search", "Search factory")}</label>
          <input id="rev-q" className="ax-input" name="q" defaultValue={q} placeholder={t("review.list.searchPh", "name or code")} /></div>
        <div className="ax-field"><label className="ax-field__label" htmlFor="rev-status">{t("review.list.filterStatus", "Status")}</label>
          <select id="rev-status" className="ax-input" name="status" defaultValue={statusFilter}>
            <option value="">{t("review.list.allStatuses", "all statuses")}</option>
            {["pending_review", "under_review", "approved", "returned", "rejected"].map(s => (
              <option key={s} value={s}>{t(`enum.${s}`, s.replace(/_/g, " "))}</option>
            ))}
          </select></div>
        <button className="ax-btn ax-btn--secondary" style={{ alignSelf: "flex-end" }}>{t("review.list.apply", "Apply")}</button>
      </form>
      {pending.map(r => {
        const insp = r.inspections as unknown as { visits: { factories: { name: string; factory_code: string } } } | null;
        return <DecisionPanel key={r.id} reviewId={r.id} factory={insp?.visits?.factories?.name ?? r.id.slice(0, 8)} strings={panelStrings} />;
      })}
      {(reviews ?? []).length === 0 ? (
        <div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">✅</span><h4>{t("review.list.empty", "Queue clear")}</h4></div></div>
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr><th>{t("review.list.colFactory", "Factory")}</th><th>{t("review.list.colVersion", "Version")}</th><th className="ax-td-num">{t("review.list.colSubmitted", "Submitted")}</th><th>{t("review.list.colStatus", "Status")}</th><th>{t("review.list.colDecision", "Decision")}</th><th>{t("review.list.colReturnScope", "Return scope")}</th><th>{t("review.list.colReason", "Reason")}</th></tr></thead>
          <tbody>
            {(reviews ?? []).map(r => {
              const sv = r.submission_versions as unknown as { version_number: number; submitted_at: string } | null;
              const insp = r.inspections as unknown as { visits: { factories: { name: string; factory_code: string } } } | null;
              return (
                <tr key={r.id}>
                  <td><strong>{insp?.visits?.factories?.name}</strong> <span className="ax-caption">{insp?.visits?.factories?.factory_code}</span></td>
                  <td><span className="ax-version">v{sv?.version_number}</span></td>
                  <td className="ax-td-num ax-numeric">{sv ? new Date(sv.submitted_at).toISOString().slice(0, 16).replace("T", " ") : "—"}</td>
                  <td><span className={`ax-lozenge ax-lozenge--review ${TONE[r.status] ?? ""}`}>{t(`enum.${r.status}`, r.status.replace(/_/g, " "))}</span></td>
                  <td>{r.decision ? t(`enum.${r.decision}`, r.decision) : "—"}</td>
                  <td>{r.returned_sections ? (r.returned_sections as string[]).join(", ") : "—"}</td>
                  <td className="ax-caption">{r.decision_reason ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      )}
      <div className="ax-banner ax-banner--immutable"><div><strong>{t("review.list.immutableTitle", "Decisions are immutable")}</strong> {t("review.list.immutableBody", "— the database rejects edits to decided reviews (proven live: B3-EV-001 P10-NEG). Every resubmission creates a new version; v1 remains locked forever.")}</div></div>
    </Shell>
  );
}
