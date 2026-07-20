import Shell, { preloadShell } from "@/components/Shell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { getUserRoles } from "@/lib/persona";
import { useT } from "@/lib/i18n";
import { ReviewQueue, type QueueBadges, type QueueRow, type Readiness, type ReadinessFact, type ReviewQueueStrings } from "./DecisionPanel";

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
  id: string; status: string; decided_at: string | null; reviewer_id: string | null;
  submission_versions: { version_number: number; submitted_at: string; acknowledgement: unknown; snapshot: { answers?: Record<string, string> } | null } | null;
  inspections: {
    id: string; status: string; submitted_at: string | null;
    visits: {
      visit_type: string; execution_mode: string; priority: string | null;
      factories: { name: string; factory_code: string; risk_band: string | null } | null;
      assignments: { profiles: { full_name: string } | null }[] | null;
    } | null;
    violations: { violation_codes: { level: string } | null }[] | null;
    evidence: { id: string }[] | null;
  } | null;
};

const fmt = (iso: string | null) => iso ? new Date(iso).toISOString().slice(0, 16).replace("T", " ") : "—";

export default async function Reviews() {
  preloadShell("/reviews");
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();

  // Distinguish unauthorized from queue-clear (WIRING leg 1). RLS is still the
  // real boundary; this only lets us render the correct empty/denied state
  // instead of a misleading "queue clear".
  const { data: roleRows } = user ? await getUserRoles(user.id) : { data: null };
  const roles = new Set((roleRows ?? []).map(r => r.role_key));
  const authorized = roles.has("reviewer") || roles.has("ops");

  // Load the RLS-scoped queue page; search/status/risk/overdue filtering happens
  // client-side over these rows (M06-014/030). Readiness sources (checklist
  // answers, acknowledgement, evidence) are joined so the fingerprint can derive
  // real facts (CD-028 leg 3b) instead of showing everything "unavailable".
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
  const work = workingDays(sla?.calendar?.days);
  const now = Date.now();
  const missingSla = reviewDays == null;

  const rows: Joined[] = (allReviews ?? []) as unknown as Joined[];

  // CD-028 discoverability fix — a submitted inspection has no `reviews` row
  // until an explicit startReview claims it, so the reviews-based query above
  // structurally cannot show brand-new work. status='submitted' is exactly
  // the set with no under_review/decided row for their current version
  // (startReview and decide() both transition status away from 'submitted'
  // the moment a row exists), so this can never duplicate a row already in
  // `rows` above — no exists/not-exists check needed.
  for (const insp of (undiscovered ?? []) as unknown as {
    id: string; status: string; submitted_at: string | null;
    visits: Joined["inspections"] extends null ? never : NonNullable<Joined["inspections"]>["visits"];
    submission_versions: { version_number: number; submitted_at: string; acknowledgement: unknown; snapshot: { answers?: Record<string, string> } | null }[];
    violations: NonNullable<Joined["inspections"]>["violations"];
    evidence: NonNullable<Joined["inspections"]>["evidence"];
  }[]) {
    const latest = (insp.submission_versions ?? []).slice().sort((a, b) => b.version_number - a.version_number)[0];
    if (!latest) continue; // no submission on record yet — nothing to surface
    rows.push({
      id: `virtual:${insp.id}`, status: "pending_review", decided_at: null, reviewer_id: null,
      submission_versions: latest,
      inspections: { id: insp.id, status: insp.status, submitted_at: insp.submitted_at, visits: insp.visits, violations: insp.violations, evidence: insp.evidence },
    });
  }

  // Factory-data verification readiness (M04-190 / M06-017 / M06-034), batched
  // for every inspection in the page. Tolerant: a missing table (0020 pending)
  // or RLS gap leaves the map empty and marks the fact "unavailable" — never a
  // fabricated "verified".
  const inspectionIds = [...new Set(rows.map(r => r.inspections?.id).filter((x): x is string => !!x))];
  const { data: fvRows, error: fvErr } = inspectionIds.length
    ? await sb.from("inspection_factory_checks").select("inspection_id, status").in("inspection_id", inspectionIds)
    : { data: [], error: null };
  const fvMap = new Map<string, { any: boolean; updated: boolean }>();
  for (const c of (fvRows ?? []) as { inspection_id: string; status: string }[]) {
    const cur = fvMap.get(c.inspection_id) ?? { any: false, updated: false };
    fvMap.set(c.inspection_id, { any: true, updated: cur.updated || c.status === "updated" });
  }
  const fvReadable = !fvErr;

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

  // CD-028 leg 3b — the four readiness facts, each derived from a real RLS
  // read. A row whose linked sources cannot be read is marked unreadable and
  // every fact reads "unavailable"; nothing is defaulted to ready.
  const readinessFor = (r: Joined): { readiness: Readiness; readable: boolean } => {
    const readable = !!r.inspections;
    const sv = r.submission_versions;
    const checklist: ReadinessFact = !sv ? "unavailable" : (Object.keys(sv.snapshot?.answers ?? {}).length > 0 ? "present" : "missing");
    const ack: ReadinessFact = !sv ? "unavailable" : (sv.acknowledgement != null ? "present" : "missing");
    const evidence: ReadinessFact = !readable ? "unavailable" : ((r.inspections?.evidence?.length ?? 0) > 0 ? "present" : "missing");
    let factory: ReadinessFact = "unavailable";
    if (fvReadable && readable) {
      const fv = fvMap.get(r.inspections!.id);
      factory = !fv ? "missing" : (fv.updated ? "updated" : "verified");
    }
    return { readiness: { checklist, evidence, ack, factory }, readable };
  };

  let degraded = !!reviewsErr || !!undiscoveredErr || !fvReadable;

  const queueRows: QueueRow[] = rows.map(r => {
    const v = r.inspections?.visits;
    const f = v?.factories;
    const inspector = v?.assignments?.[0]?.profiles?.full_name ?? "";
    const { readiness, readable } = readinessFor(r);
    if (!readable) degraded = true;
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
      modeLabel: v ? t(`enum.${v.execution_mode}`, v.execution_mode) : "—",
      typeLabel: v ? t(`enum.${v.visit_type}`, v.visit_type) : "—",
      readiness,
      readable,
      unassigned: r.reviewer_id == null && !r.decided_at,
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
    noMatchBody: t("review.list.noMatchBody", "Adjust or clear the search, status, risk and overdue filters."),
    colFactory: t("review.list.colFactory", "Factory"),
    colInspector: t("review.list.colInspector", "Inspector"),
    colTypeMode: t("review.list.colTypeMode", "Type · mode"),
    colVersion: t("review.list.colVersion", "Version"),
    colFingerprint: t("review.list.colFingerprint", "Evidence readiness & SLA-risk"),
    colStatus: t("review.list.colStatus", "Status"),
    colOpen: t("review.list.colOpen", "Workspace"),
    open: t("review.list.open", "Open workspace"),
    openHint: t("review.list.openHint", "Opens /reviews/:id read-only. Starting and deciding the review happen there, as explicit audited actions — this queue changes nothing."),
    fpTitle: t("review.list.fpTitle", "Evidence readiness & SLA-risk fingerprint"),
    fpHint: t("review.list.fpHint", "Labelled facts only — never a single severity score or colour-only signal. Missing SLA is not on-time; a risk band is not a recommendation. Any fact that cannot be read shows 'unavailable', never an invented result."),
    fp: {
      sla: t("review.list.fp.sla", "SLA"),
      slaOverdue: t("review.list.fp.slaOverdue", "overdue"),
      slaOnTime: t("review.list.fp.slaOnTime", "on time"),
      slaUnavailable: t("review.list.fp.slaUnavailable", "SLA unavailable — required config/timestamp missing"),
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
      readyBlockTag: t("review.list.fp.readyBlockTag", "derived (RLS-scoped)"),
      noEvidenceTitle: t("review.list.fp.noEvidenceTitle", "Evidence not yet readable"),
      noEvidenceBody: t("review.list.fp.noEvidenceBody", "A linked submission/evidence source could not be read for this row. It is flagged, not counted as ready — do not decide from an unreadable record."),
      unassignedTitle: t("review.list.fp.unassignedTitle", "Unassigned reviewer"),
      unassignedBlocked: t("review.list.fp.unassignedBlocked", "claim/reassign unavailable"),
    },
  };

  return (
    <Shell current="/reviews" title={t("review.list.title", "Level 2 review queue")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("review.list.context", "SCR-WEB-300 · /reviews · RLS-scoped")}</span>}>
      {!authorized ? (
        <section className="ax-surface cd-panelpad cd-result" role="alert">
          <div className="cd-result__row"><div className="cd-result__icon cd-result__icon--critical" aria-hidden="true">⛔</div>
            <div className="cd-stack"><h3 tabIndex={-1}>{t("review.list.unauthTitle", "You don’t have access to the review queue")}</h3>
              <p>{t("review.list.unauthBody", "This queue requires the Level 2 Reviewer role and matching scope. Navigation visibility is not authorization; RLS remains the boundary.")}</p></div></div>
        </section>
      ) : (
        <>
          {/* opening is read-only now (CD-028 leg 5/10 resolved) — say so plainly */}
          <div className="ax-banner" role="note"><div><strong>{t("review.list.scanTitle", "Scan-first queue")}</strong> — {t("review.list.scanBody", "Opening a review is read-only. Starting and deciding happen in the workspace as explicit, audited actions. This queue never edits inspector content or mutates state.")}</div></div>
          {missingSla && <div className="ax-banner ax-banner--warning" role="note"><div><strong>{t("review.list.missingSlaTitle", "SLA configuration missing")}</strong> — {t("review.list.missingSlaBody", "engine_settings has no review_business_days / working-day calendar, so no SLA state is derived. Rows show 'SLA unavailable' — never invented as on-time.")}</div></div>}
          {degraded && <div className="ax-banner ax-banner--warning" role="alert"><div><strong>{t("review.list.degradedTitle", "Some linked information is unavailable")}</strong> — {t("review.list.degradedBody", "The queue loaded, but a linked source (evidence, factory-verification or violation counts) could not be read for some rows. Those facts read 'unavailable', never a default value.")}</div></div>}
          {rows.length === 0 ? (
            <section className="ax-surface cd-panelpad cd-result" role="status">
              <div className="cd-result__row"><div className="cd-result__icon cd-result__icon--ok" aria-hidden="true">✅</div>
                <div className="cd-stack"><h3 tabIndex={-1}>{t("review.list.empty", "Queue clear")}</h3>
                  <p>{t("review.list.emptyBody", "No reviews in your scope await a Level 2 decision.")}</p></div></div>
            </section>
          ) : (
            <ReviewQueue rows={queueRows} statusOptions={statusOptions} riskOptions={riskOptions} strings={queueStrings} />
          )}
          <div className="ax-banner ax-banner--immutable"><div><strong>{t("review.list.immutableTitle", "Decisions are immutable")}</strong> {t("review.list.immutableBody", "— the database rejects edits to decided reviews (proven live: B3-EV-001 P10-NEG). Every resubmission creates a new version; v1 remains locked forever.")}</div></div>
        </>
      )}
    </Shell>
  );
}
