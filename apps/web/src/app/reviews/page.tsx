import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import DecisionPanel, { ReviewQueue, type DecisionPanelStrings, type QueueBadges, type QueueRow, type ReviewQueueStrings } from "./DecisionPanel";

export const dynamic = "force-dynamic";

const TONE: Record<string, string> = { approved: "ax-lozenge--success", returned: "ax-lozenge--warning", rejected: "ax-lozenge--critical", under_review: "ax-lozenge--info", pending_review: "ax-lozenge--warning" };
const RISK_TONE: Record<string, string> = { low: "ax-lozenge--success", medium: "ax-lozenge--warning", high: "ax-lozenge--critical" };

// Working-day set derived from engine_settings.sla.calendar.days (e.g. "Sun-Thu").
// Never invents the weekend — reads it from the accepted config, degrades to
// calendar days when unparseable.
const DAY_IDX: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
function workingDays(spec: string | undefined): Set<number> {
  const s = new Set<number>();
  if (!spec) return s;
  for (const part of spec.split(",")) {
    const m = part.trim().toLowerCase().match(/^([a-z]{3})\s*-\s*([a-z]{3})$/);
    if (m && DAY_IDX[m[1]] != null && DAY_IDX[m[2]] != null) {
      let a = DAY_IDX[m[1]]; const b = DAY_IDX[m[2]];
      for (let i = 0; i < 7; i++) { s.add(a); if (a === b) break; a = (a + 1) % 7; }
    } else {
      const one = part.trim().toLowerCase().slice(0, 3);
      if (DAY_IDX[one] != null) s.add(DAY_IDX[one]);
    }
  }
  return s;
}
// Deadline = submitted_at + n working days (working set from config; empty ⇒
// calendar days). Returns null when the threshold or timestamp is missing.
function slaDeadline(submittedISO: string | null, days: number | null, work: Set<number>): Date | null {
  if (!submittedISO || days == null) return null;
  const d = new Date(submittedISO);
  if (Number.isNaN(d.getTime())) return null;
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (work.size === 0 || work.has(d.getUTCDay())) added++;
  }
  return d;
}

type Joined = {
  id: string; status: string; decision: string | null; decision_reason: string | null;
  returned_sections: string[] | null; decided_at: string | null;
  submission_versions: { version_number: number; submitted_at: string } | null;
  inspections: {
    id: string; status: string; submitted_at: string | null;
    visits: {
      visit_type: string; execution_mode: string; priority: string | null;
      factories: { name: string; factory_code: string; risk_band: string | null } | null;
      assignments: { profiles: { full_name: string } | null }[] | null;
    } | null;
    violations: { violation_codes: { level: string } | null }[] | null;
  } | null;
};

const fmt = (iso: string | null) => iso ? new Date(iso).toISOString().slice(0, 16).replace("T", " ") : "—";

export default async function Reviews() {
  const { t } = await useT();
  const sb = await supabaseServer();
  // Load the RLS-scoped queue page; search/status/risk/overdue filtering happens
  // client-side over these rows (M06-014/030).
  const [{ data: allReviews }, { data: slaRow }] = await Promise.all([
    sb.from("reviews")
      .select(`id, status, decision, decision_reason, returned_sections, decided_at,
        submission_versions(version_number, submitted_at),
        inspections(id, status, submitted_at,
          visits(visit_type, execution_mode, priority,
            factories(name, factory_code, risk_band),
            assignments(profiles(full_name))),
          violations(violation_codes(level)))`)
      .order("decided_at", { ascending: false, nullsFirst: true }),
    sb.from("engine_settings").select("settings").eq("engine", "sla").maybeSingle(),
  ]);
  const sla = slaRow?.settings as { review_business_days?: number; calendar?: { days?: string } } | undefined;
  const reviewDays = sla?.review_business_days ?? null;
  const work = workingDays(sla?.calendar?.days);
  const now = Date.now();

  const rows: Joined[] = (allReviews ?? []) as unknown as Joined[];

  // M06-031 — compute badges per review: SLA status vs config threshold, risk
  // band from the factory, critical-violation (level L1) count, priority.
  const criticalLabel = t("review.list.criticalBadge", "{n} critical");
  const slaOnTimeLabel = t("review.list.slaOnTime", "on time");
  const slaOverdueLabel = t("review.list.slaOverdue", "overdue");
  const badgesFor = (r: Joined): QueueBadges => {
    const v = r.inspections?.visits;
    const band = v?.factories?.risk_band ?? null;
    const submitted = r.submission_versions?.submitted_at ?? r.inspections?.submitted_at ?? null;
    const decided = !!r.decided_at;
    const deadline = decided ? null : slaDeadline(submitted, reviewDays, work);
    const slaState: QueueBadges["slaState"] = deadline == null ? "none" : (now > deadline.getTime() ? "overdue" : "on_time");
    const criticalCount = (r.inspections?.violations ?? []).filter(x => x.violation_codes?.level === "L1").length;
    const priority = v?.priority?.trim() || null;
    return {
      slaState,
      slaLabel: slaState === "overdue" ? slaOverdueLabel : slaOnTimeLabel,
      slaTone: slaState === "overdue" ? "ax-lozenge--critical" : "ax-lozenge--success",
      riskBand: band,
      riskLabel: band ? t(`enum.${band}`, band) : "",
      riskTone: band ? (RISK_TONE[band] ?? "ax-lozenge--info") : "",
      criticalCount,
      criticalLabel: criticalLabel.replace("{n}", String(criticalCount)),
      priorityLabel: priority ? t(`enum.priority.${priority}`, priority) : null,
    };
  };

  const pending = rows.filter(r => !r.decided_at);

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

  // M06-013/016 — enriched queue rows: inspector, execution mode, visit type,
  // risk, SLA/overdue, critical count, priority — all pre-translated for the
  // client table.
  const queueRows: QueueRow[] = rows.map(r => {
    const v = r.inspections?.visits;
    const f = v?.factories;
    const inspector = v?.assignments?.[0]?.profiles?.full_name ?? "";
    return {
      ...badgesFor(r),
      id: r.id,
      href: r.inspections ? `/reviews/${r.inspections.id}` : "/reviews",
      factoryName: f?.name ?? (r.inspections?.id?.slice(0, 8) ?? "—"),
      factoryCode: f?.factory_code ?? "",
      inspectorName: inspector,
      versionNumber: r.submission_versions?.version_number ?? null,
      submittedDisplay: fmt(r.submission_versions?.submitted_at ?? r.inspections?.submitted_at ?? null),
      status: r.status,
      statusLabel: t(`enum.${r.status}`, r.status.replace(/_/g, " ")),
      statusTone: TONE[r.status] ?? "",
      decisionLabel: r.decision ? t(`enum.${r.decision}`, r.decision) : "—",
      returnScope: r.returned_sections?.length ? r.returned_sections.join(", ") : "—",
      reason: r.decision_reason ?? "—",
      modeLabel: v ? t(`enum.${v.execution_mode}`, v.execution_mode) : "—",
      typeLabel: v ? t(`enum.${v.visit_type}`, v.visit_type) : "—",
    };
  });

  const distinct = (vals: (string | null)[]) => [...new Set(vals.filter((x): x is string => !!x))].sort();
  const statusOptions = distinct(rows.map(r => r.status)).map(s => ({ value: s, label: t(`enum.${s}`, s.replace(/_/g, " ")) }));
  const riskOptions = distinct(rows.map(r => r.inspections?.visits?.factories?.risk_band ?? null)).map(b => ({ value: b, label: t(`enum.${b}`, b) }));

  const queueStrings: ReviewQueueStrings = {
    searchPlaceholder: t("review.list.searchPh", "factory, code or inspector…"),
    searchAria: t("review.list.searchAria", "Search the review queue (M06-014)"),
    allStatuses: t("review.list.allStatuses", "All statuses"),
    allRisks: t("review.list.allRisks", "All risk levels"),
    overdueOnly: t("review.list.overdueOnly", "Overdue only"),
    clearFilters: t("review.list.clearFilters", "Clear filters"),
    showing: t("review.list.showing", "{shown} of {total}"),
    noMatch: t("review.list.noMatch", "No reviews match the filters"),
    colFactory: t("review.list.colFactory", "Factory"),
    colInspector: t("review.list.colInspector", "Inspector"),
    colTypeMode: t("review.list.colTypeMode", "Type · mode"),
    colSubmitted: t("review.list.colSubmitted", "Submitted"),
    colVersion: t("review.list.colVersion", "Version"),
    colRisk: t("review.list.colRisk", "Risk"),
    colSla: t("review.list.colSla", "SLA"),
    colCritical: t("review.list.colCritical", "Critical"),
    colPriority: t("review.list.colPriority", "Priority"),
    colStatus: t("review.list.colStatus", "Status"),
    colDecision: t("review.list.colDecision", "Decision"),
    colReturnScope: t("review.list.colReturnScope", "Return scope"),
    colReason: t("review.list.colReason", "Reason"),
    colOpen: t("review.list.colOpen", "Workspace"),
    open: t("review.list.open", "Open"),
  };

  return (
    <Shell current="/reviews" title={t("review.list.title", "Level 2 review")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("review.list.context", "SCR-WEB-300/310 · live data from golden slice")}</span>}>
      {pending.map(r => {
        const factory = r.inspections?.visits?.factories?.name ?? r.id.slice(0, 8);
        return <DecisionPanel key={r.id} reviewId={r.id} factory={factory} strings={panelStrings} meta={badgesFor(r)} />;
      })}
      {rows.length === 0 ? (
        <div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">✅</span><h4>{t("review.list.empty", "Queue clear")}</h4></div></div>
      ) : (
        <ReviewQueue rows={queueRows} statusOptions={statusOptions} riskOptions={riskOptions} strings={queueStrings} />
      )}
      <div className="ax-banner ax-banner--immutable"><div><strong>{t("review.list.immutableTitle", "Decisions are immutable")}</strong> {t("review.list.immutableBody", "— the database rejects edits to decided reviews (proven live: B3-EV-001 P10-NEG). Every resubmission creates a new version; v1 remains locked forever.")}</div></div>
    </Shell>
  );
}
