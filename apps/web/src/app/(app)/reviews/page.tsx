import Shell, { preloadShell } from "@/components/Shell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { getUserRoles } from "@/lib/persona";
import { useT } from "@/lib/i18n";
import { ReviewQueue, type QueueBadges, type QueueRow, type Readiness, type ReadinessFact, type ReviewQueueStrings } from "./ReviewQueue";
import styles from "./responsive.module.css";

const TONE: Record<string, string> = { approved: "sq-lozenge--success", returned: "sq-lozenge--warning", rejected: "sq-lozenge--critical", under_review: "sq-lozenge--info", pending_review: "sq-lozenge--warning" };
const RISK_TONE: Record<string, string> = { low: "sq-lozenge--success", medium: "sq-lozenge--warning", high: "sq-lozenge--critical" };
const DAY_IDX: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

function workingDays(spec: string | undefined): Set<number> {
  const days = new Set<number>();
  if (!spec) return days;
  for (const part of spec.split(",")) {
    const range = part.trim().toLowerCase().match(/^([a-z]{3})\s*-\s*([a-z]{3})$/);
    if (range && DAY_IDX[range[1]] != null && DAY_IDX[range[2]] != null) {
      let day = DAY_IDX[range[1]];
      const end = DAY_IDX[range[2]];
      for (let index = 0; index < 7; index++) {
        days.add(day);
        if (day === end) break;
        day = (day + 1) % 7;
      }
    } else {
      const day = part.trim().toLowerCase().slice(0, 3);
      if (DAY_IDX[day] != null) days.add(DAY_IDX[day]);
    }
  }
  return days;
}

function slaDeadline(submittedAt: string | null, businessDays: number | null, workDays: Set<number>): Date | null {
  if (!submittedAt || businessDays == null) return null;
  const deadline = new Date(submittedAt);
  if (Number.isNaN(deadline.getTime())) return null;
  let added = 0;
  while (added < businessDays) {
    deadline.setUTCDate(deadline.getUTCDate() + 1);
    if (workDays.size === 0 || workDays.has(deadline.getUTCDay())) added++;
  }
  return deadline;
}

type Joined = {
  id: string;
  status: string;
  decided_at: string | null;
  reviewer_id: string | null;
  submission_versions: {
    version_number: number;
    submitted_at: string;
    acknowledgement: unknown;
    snapshot: { answers?: Record<string, string> } | null;
  } | null;
  inspections: {
    id: string;
    status: string;
    submitted_at: string | null;
    visits: {
      visit_type: string;
      execution_mode: string;
      priority: string | null;
      factories: { name: string; factory_code: string; risk_band: string | null } | null;
      assignments: { profiles: { full_name: string } | null }[] | null;
    } | null;
    violations: { violation_codes: { level: string } | null }[] | null;
    evidence: { id: string }[] | null;
  } | null;
};

const fmt = (iso: string | null) => iso ? new Date(iso).toISOString().slice(0, 16).replace("T", " ") : "—";

export const dynamic = "force-dynamic";

export default async function Reviews() {
  preloadShell("/reviews");
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();
  const { data: roleRows } = user ? await getUserRoles(user.id) : { data: null };
  const roles = new Set((roleRows ?? []).map(row => row.role_key));
  // Queue visibility is broader than decision authority. Planner users can
  // monitor coordinated work, while inspectors remain limited by RLS to their
  // own assigned inspections. Canonical review actions stay reviewer/ops-only.
  const authorized = ["reviewer", "ops", "planner", "inspector"].some(role => roles.has(role));

  if (!authorized) {
    return (
      <Shell current="/reviews" title={t("review.list.title", "Inspection review queue")}>
        <main className={styles.reviewRoot}>
          <section className="sq-surface cd-panelpad cd-result" role="alert">
            <div className="cd-result__row">
              <div className="cd-result__icon cd-result__icon--critical" aria-hidden="true">⛔</div>
              <div className="cd-stack">
                <h2>{t("review.list.unauthTitle", "You don’t have access to the review queue")}</h2>
                <p>{t("review.list.unauthBody", "This queue requires an authorized review, planning, operations or assigned-inspector role with matching scope. Navigation visibility is not authorization.")}</p>
              </div>
            </div>
          </section>
        </main>
      </Shell>
    );
  }

  const [{ data: allReviews, error: reviewsErr }, { data: slaRow }, { data: undiscovered, error: undiscoveredErr }] = await Promise.all([
    sb.from("reviews")
      .select(`id, status, decided_at, reviewer_id,
        submission_versions(version_number, submitted_at, acknowledgement, snapshot),
        inspections(id, status, submitted_at,
          visits(visit_type, execution_mode, priority,
            factories(name, factory_code, risk_band),
            assignments(profiles(full_name))),
          violations(violation_codes(level)),
          evidence(id))`)
      .order("decided_at", { ascending: false, nullsFirst: true }),
    sb.from("engine_settings").select("settings").eq("engine", "sla").maybeSingle(),
    sb.from("inspections")
      .select(`id, status, submitted_at,
        visits(visit_type, execution_mode, priority,
          factories(name, factory_code, risk_band),
          assignments(profiles(full_name))),
        submission_versions(id, version_number, submitted_at, acknowledgement, snapshot),
        violations(violation_codes(level)),
        evidence(id)`)
      .eq("status", "submitted"),
  ]);

  const sla = slaRow?.settings as { review_business_days?: number; calendar?: { days?: string } } | undefined;
  const reviewDays = sla?.review_business_days ?? null;
  const workDays = workingDays(sla?.calendar?.days);
  const now = Date.now();
  const rows: Joined[] = (allReviews ?? []) as unknown as Joined[];

  for (const inspection of (undiscovered ?? []) as unknown as {
    id: string;
    status: string;
    submitted_at: string | null;
    visits: NonNullable<Joined["inspections"]>["visits"];
    submission_versions: NonNullable<Joined["submission_versions"]>[];
    violations: NonNullable<Joined["inspections"]>["violations"];
    evidence: NonNullable<Joined["inspections"]>["evidence"];
  }[]) {
    const latest = inspection.submission_versions.slice().sort((a, b) => b.version_number - a.version_number)[0];
    if (!latest) continue;
    rows.push({
      id: `virtual:${inspection.id}`,
      status: "pending_review",
      decided_at: null,
      reviewer_id: null,
      submission_versions: latest,
      inspections: {
        id: inspection.id,
        status: inspection.status,
        submitted_at: inspection.submitted_at,
        visits: inspection.visits,
        violations: inspection.violations,
        evidence: inspection.evidence,
      },
    });
  }

  const inspectionIds = [...new Set(rows.map(row => row.inspections?.id).filter((id): id is string => !!id))];
  const { data: factoryChecks, error: factoryChecksErr } = inspectionIds.length
    ? await sb.from("inspection_factory_checks").select("inspection_id, status").in("inspection_id", inspectionIds)
    : { data: [], error: null };
  const factoryCheckMap = new Map<string, { updated: boolean }>();
  for (const check of (factoryChecks ?? []) as { inspection_id: string; status: string }[]) {
    const current = factoryCheckMap.get(check.inspection_id);
    factoryCheckMap.set(check.inspection_id, { updated: current?.updated === true || check.status === "updated" });
  }
  const factoryChecksReadable = !factoryChecksErr;

  const readinessFor = (row: Joined): { readiness: Readiness; readable: boolean } => {
    const readable = !!row.inspections;
    const version = row.submission_versions;
    const checklist: ReadinessFact = !version ? "unavailable" : Object.keys(version.snapshot?.answers ?? {}).length > 0 ? "present" : "missing";
    const acknowledgement: ReadinessFact = !version ? "unavailable" : version.acknowledgement != null ? "present" : "missing";
    const evidence: ReadinessFact = !readable ? "unavailable" : (row.inspections?.evidence?.length ?? 0) > 0 ? "present" : "missing";
    let factory: ReadinessFact = "unavailable";
    if (readable && factoryChecksReadable) {
      const check = factoryCheckMap.get(row.inspections!.id);
      factory = !check ? "missing" : check.updated ? "updated" : "verified";
    }
    return { readiness: { checklist, evidence, ack: acknowledgement, factory }, readable };
  };

  let degraded = !!reviewsErr || !!undiscoveredErr || !factoryChecksReadable;
  const criticalLabel = t("review.list.criticalBadge", "{n} critical");
  const queueRows: QueueRow[] = rows.map(row => {
    const visit = row.inspections?.visits;
    const factory = visit?.factories;
    const submittedAt = row.submission_versions?.submitted_at ?? row.inspections?.submitted_at ?? null;
    const deadline = row.decided_at ? null : slaDeadline(submittedAt, reviewDays, workDays);
    const slaState: QueueBadges["slaState"] = !deadline ? "none" : now > deadline.getTime() ? "overdue" : "on_time";
    const criticalCount = (row.inspections?.violations ?? []).filter(item => item.violation_codes?.level === "L1").length;
    const riskBand = factory?.risk_band ?? null;
    const { readiness, readable } = readinessFor(row);
    if (!readable) degraded = true;
    return {
      id: row.id,
      href: row.inspections ? `/reviews/${row.inspections.id}` : "/reviews",
      factoryName: factory?.name ?? row.inspections?.id?.slice(0, 8) ?? "—",
      factoryCode: factory?.factory_code ?? "",
      inspectorName: visit?.assignments?.[0]?.profiles?.full_name ?? "",
      versionNumber: row.submission_versions?.version_number ?? null,
      submittedDisplay: fmt(submittedAt),
      status: row.status,
      statusLabel: t(`enum.${row.status}`, row.status.replace(/_/g, " ")),
      statusTone: TONE[row.status] ?? "",
      modeLabel: visit ? t(`enum.${visit.execution_mode}`, visit.execution_mode) : "—",
      typeLabel: visit ? t(`enum.${visit.visit_type}`, visit.visit_type) : "—",
      readiness,
      readable,
      unassigned: row.reviewer_id == null && !row.decided_at,
      slaState,
      slaLabel: slaState === "overdue" ? t("review.list.slaOverdue", "overdue") : t("review.list.slaOnTime", "on time"),
      slaTone: slaState === "overdue" ? "sq-lozenge--critical" : "sq-lozenge--success",
      riskBand,
      riskLabel: riskBand ? t(`enum.${riskBand}`, riskBand) : "",
      riskTone: riskBand ? RISK_TONE[riskBand] ?? "sq-lozenge--info" : "",
      criticalCount,
      criticalLabel: criticalLabel.replace("{n}", String(criticalCount)),
      priorityLabel: visit?.priority?.trim() ? t(`enum.priority.${visit.priority}`, visit.priority) : null,
    };
  });

  const distinct = (values: (string | null)[]) => [...new Set(values.filter((value): value is string => !!value))].sort();
  // CLASS-CONTRACT.md § Review & Approval — fixed 5-option seg, not a
  // dynamically-derived dropdown. Order and labels match the contract verbatim.
  const statusOptions = [
    { value: "pending_review", label: t("review.list.status.submitted", "Submitted") },
    { value: "under_review", label: t("review.list.status.inReview", "In review") },
    { value: "returned", label: t("review.list.status.returned", "Returned") },
    { value: "approved", label: t("review.list.status.approved", "Approved") },
    { value: "rejected", label: t("review.list.status.rejected", "Rejected") },
  ];
  const riskOptions = distinct(rows.map(row => row.inspections?.visits?.factories?.risk_band ?? null)).map(value => ({ value, label: t(`enum.${value}`, value) }));
  const strings: ReviewQueueStrings = {
    searchPlaceholder: t("review.list.searchPh", "factory, code or inspector…"),
    searchAria: t("review.list.searchAria", "Search the review queue"),
    allStatuses: t("review.list.allStatuses", "All statuses"),
    allRisks: t("review.list.allRisks", "All risk levels"),
    overdueOnly: t("review.list.overdueOnly", "Overdue only"),
    clearFilters: t("review.list.clearFilters", "Clear filters"),
    showing: t("review.list.showing", "{shown} of {total}"),
    noMatch: t("review.list.noMatch", "No reviews match the filters"),
    noMatchBody: t("review.list.noMatchBody", "Adjust or clear the search, status, risk and overdue filters."),
    colFactory: t("review.list.colFactory", "Factory"),
    colInspector: t("review.list.colInspector", "Inspector"),
    colTypeMode: t("review.list.colTypeMode", "Type · mode"),
    colVersion: t("review.list.colVersion", "Version"),
    colFingerprint: t("review.list.colFingerprint", "Review readiness"),
    colStatus: t("review.list.colStatus", "Status"),
    colOpen: t("review.list.colOpen", "Review"),
    open: t("review.list.open", "Open review"),
    openHint: t("review.list.openHint", "Opens the review read-only. Starting and deciding happen there as explicit audited actions."),
    fpTitle: t("review.list.fpTitle", "Review readiness"),
    fpHint: t("review.list.fpHint", "Facts come from RLS-scoped records. Unreadable facts remain unavailable."),
    fp: {
      sla: t("review.list.fp.sla", "Deadline"),
      slaOverdue: t("review.list.fp.slaOverdue", "overdue"),
      slaOnTime: t("review.list.fp.slaOnTime", "on time"),
      slaUnavailable: t("review.list.fp.slaUnavailable", "Deadline unavailable — required configuration or timestamp is missing"),
      risk: t("review.list.fp.risk", "Risk"),
      critical: t("review.list.fp.critical", "critical (L1)"),
      priority: t("review.list.fp.priority", "priority"),
      checklist: t("review.list.fp.checklist", "Checklist"),
      evidence: t("review.list.fp.evidence", "Evidence"),
      ack: t("review.list.fp.ack", "Acknowledgement"),
      factory: t("review.list.fp.factory", "Factory verify"),
      present: t("review.list.fp.present", "present"),
      missing: t("review.list.fp.missing", "missing"),
      verified: t("review.list.fp.verified", "verified"),
      updated: t("review.list.fp.updated", "updated"),
      unavailable: t("review.list.fp.unavailable", "unavailable"),
      readyBlockTag: t("review.list.fp.readyBlockTag", "derived"),
      noEvidenceTitle: t("review.list.fp.noEvidenceTitle", "Evidence not yet readable"),
      noEvidenceBody: t("review.list.fp.noEvidenceBody", "A linked source could not be read. It is not counted as ready."),
      unassignedTitle: t("review.list.fp.unassignedTitle", "Unassigned reviewer"),
      unassignedBlocked: t("review.list.fp.unassignedBlocked", "claim/reassign unavailable"),
    },
  };

  return (
    <Shell current="/reviews" title={t("review.list.title", "Inspection review queue")}
      context={<span className="sq-lozenge sq-lozenge--info">{t("review.list.context", "Read-only queue")}</span>}>
      <main className={styles.reviewRoot}>
        <div className="sq-banner" role="note"><div><strong>{t("review.list.scanTitle", "Review overview")}</strong> — {t("review.list.scanBody", "Opening is read-only. Starting and deciding are explicit audited actions in the workspace.")}</div></div>
        {reviewDays == null && <div className="sq-banner sq-banner--warning" role="note"><div><strong>{t("review.list.missingSlaTitle", "SLA configuration missing")}</strong> — {t("review.list.missingSlaBody", "No review deadline is derived. Rows remain unavailable rather than being reported on time.")}</div></div>}
        {degraded && <div className="sq-banner sq-banner--warning" role="alert"><div><strong>{t("review.list.degradedTitle", "Some linked information is unavailable")}</strong> — {t("review.list.degradedBody", "The queue loaded, but one or more RLS-scoped linked sources could not be read. Those facts remain unavailable.")}</div></div>}
        {rows.length === 0 ? (
          <section className="sq-surface cd-panelpad cd-result" role="status">
            <div className="cd-result__row">
              <div className="cd-result__icon cd-result__icon--ok" aria-hidden="true">✓</div>
              <div className="cd-stack">
                <h2>{t("review.list.empty", "No inspections awaiting review")}</h2>
                <p>{t("review.list.emptyBody", "No reviews in your scope await a Level 2 decision.")}</p>
              </div>
            </div>
          </section>
        ) : <ReviewQueue rows={queueRows} statusOptions={statusOptions} riskOptions={riskOptions} strings={strings} />}
        <div className="sq-banner sq-banner--warning" role="note"><div><strong>{t("review.list.submissionBlockTitle", "Submission integrity blocker")}</strong> — {t("review.list.submissionBlockBody", "DEC-032 blocks claims that new real inspection submissions are available end to end. Existing RLS-visible review records remain readable; this queue does not bypass that platform blocker.")}</div></div>
        <div className="sq-banner sq-banner--immutable"><div><strong>{t("review.list.immutableTitle", "Decisions are immutable")}</strong> {t("review.list.immutableBody", "— decided reviews cannot be edited. Every resubmission creates a new preserved version.")}</div></div>
      </main>
    </Shell>
  );
}
