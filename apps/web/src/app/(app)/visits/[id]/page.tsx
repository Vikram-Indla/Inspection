import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";
import ActionBar, { type ActionBarStrings, type PackageOption } from "./ActionBar";
import Attachments, { type AttachmentRow, type AttachmentsStrings } from "./Attachments";
import NotesEditor, { type NotesStrings } from "./NotesEditor";
import DualStateRibbon, { type RibbonTrack, type RibbonStrings } from "./DualStateRibbon";
import { type ReasonOption } from "@/lib/planning/lifecycle";
import { mapError } from "./neutral";
import CreatedToast from "@/components/CreatedToast";
import EmptyState from "@/components/EmptyState";
import FocusScroll from "./FocusScroll";
import { formatDateTime } from "@/lib/dates";
import { loadVisitDetail } from "@/features/visits/detail/queries";
import { buildVisitDerivations, reasonLabel as resolveReasonLabel, snapshotText } from "@/features/visits/detail/view";

const PLAN_TONE: Record<string, string> = { published: "badge-info", returned: "badge-warning", cancelled: "badge-critical", expired: "badge-critical" };
const PLAN_BADGE: Record<string, string> = { published: "badge-info", returned: "badge-warning", cancelled: "badge-critical", expired: "badge-critical", draft: "badge-draft" };

export default async function VisitDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; focus?: string; wa_route_base?: string }> }) {
  const { created, focus, wa_route_base } = await searchParams;
  const targetPreview = wa_route_base === "planning";
  const planningOwnedPreview = targetPreview;
  const routeBase = planningOwnedPreview ? "/planning/visits" : "/visits";
  const shellCurrent = planningOwnedPreview ? "/planning" : "/visits";
  const { id } = await params;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const page = await loadVisitDetail(id);
  if (page.kind === "error") {
    return <Shell current={shellCurrent} title={t("visit.detail.errorTitle", "Visit — error")}><div className="alert alert-critical" role="alert">{mapError(null, "load")}</div></Shell>;
  }
  if (page.kind === "not-found") {
    return <Shell current={shellCurrent} title={t("visit.detail.notFoundTitle", "Visit not found")}>
      <EmptyState glyph="∅" title={t("visit.detail.notFound", "Not in your scope or does not exist")}
        body={t("visit.detail.notFoundDesc", "IDs never change or get reused (FLD-VIS-001).")} />
    </Shell>;
  }
  const detail = page.data;
  const v = detail.visit;
  const f = detail.visit.factories;
  const plan = detail.visit.visit_plans;
  const pkg = detail.visit.package_versions;
  const inspectors = detail.inspectors;
  const lifecycleEvents = detail.lifecycle;
  const locationEvents = detail.location;
  const pkgLinks = detail.packageLinks;
  const auditRows = detail.audit;
  const returnReasons = detail.returnReasons;
  const cancelReasons = detail.cancelReasons;
  const packageOptions: PackageOption[] = detail.packageOptions;
  const expiryRuleReason = detail.expiryRuleReason;
  const siblingCount = detail.siblingCount;
  const derived = buildVisitDerivations(detail, locale);
  const asg = derived.assignment;
  const insp = derived.inspection;
  const journeys = detail.visit.journey_sessions ?? [];
  const isUnverifiedManual = derived.isUnverifiedManual;
  const latestReturnEvent = derived.latestReturn;
  const latestCancelEvent = derived.latestCancel;
  const returnReason = derived.returnReason;
  const cancelReasonDisplay = derived.cancelReasonDisplay;
  const reasonLabel = (options: ReasonOption[], key: string | null | undefined) =>
    resolveReasonLabel(options, key, locale);
  const attRows: AttachmentRow[] = detail.attachments.map(a => ({
    id: a.id, name: a.name, mime: a.mime, uploadedAt: a.uploaded_at,
    uploadedBy: a.uploader?.full_name ?? "—",
    url: detail.signedUrls.get(a.id) ?? null,
    urlError: detail.signedUrls.has(a.id) ? null : mapError(null, "link"),
  }));
  const attErr = detail.attachmentsFailed;
  const attachmentsStrings: AttachmentsStrings = {
    heading: t("visit.att.heading", "Attachments"),
    empty: t("visit.att.empty", "No attachments yet — planners and operations can attach supporting files."),
    colFile: t("visit.att.colFile", "File"),
    colType: t("visit.att.colType", "Type"),
    colUploaded: t("visit.att.colUploaded", "Uploaded"),
    colBy: t("visit.att.colBy", "By"),
    colActions: t("visit.att.colActions", "Actions"),
    download: t("visit.att.download", "Download"),
    remove: t("visit.att.remove", "Remove"),
    removeAria: t("visit.att.removeAria", "Remove attachment {name}"),
    fileLabel: t("visit.att.fileLabel", "Attach a file (planner or operations only)"),
    uploadBtn: t("visit.att.uploadBtn", "Upload"),
    uploading: t("visit.att.uploading", "Uploading…"),
    urlFailed: t("visit.att.urlFailed", "download link not available"),
  };
  const notesStrings: NotesStrings = {
    heading: t("visit.notes.heading", "Notes"),
    label: t("visit.notes.label", "Visit notes"),
    placeholder: t("visit.notes.placeholder", "Context for the inspector or operations — saved to the visit, audited"),
    saveBtn: t("visit.notes.saveBtn", "Save notes"),
    saving: t("visit.notes.saving", "Saving…"),
    hint: t("visit.notes.hint", "Planner or operations only. Return reasons show in the visit history, not here (M8)."),
  };
  const actionStrings: ActionBarStrings = {
    heading: t("visit.actions.heading", "Management actions — only valid changes are allowed"),
    returnReason: t("visit.actions.returnReason", "Return reason *"),
    returnComments: t("visit.actions.returnComments", "Return comments"),
    returnBtn: t("visit.actions.returnBtn", "Return"),
    republishBtn: t("visit.actions.republishBtn", "Republish (same ID)"),
    reassignTo: t("visit.actions.reassignTo", "Reassign to"),
    reassignReason: t("visit.actions.reassignReason", "Reassignment reason *"),
    reassignBtn: t("visit.actions.reassignBtn", "Reassign"),
    newWindowStart: t("visit.actions.newWindowStart", "New window start"),
    newWindowEnd: t("visit.actions.newWindowEnd", "New window end"),
    rescheduleBtn: t("visit.actions.rescheduleBtn", "Reschedule"),
    cancelReason: t("visit.actions.cancelReason", "Cancellation reason *"),
    cancelComments: t("visit.actions.cancelComments", "Cancellation comments"),
    cancelBtn: t("visit.actions.cancelBtn", "Cancel visit"),
    visitTypeLabel: t("visit.actions.visitTypeLabel", "Visit type (pre-start)"),
    visitTypeBtn: t("visit.actions.visitTypeBtn", "Update type"),
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    typeFollowUp: t("enum.follow_up", "Follow-up"),
    typeComplaint: t("enum.complaint", "Complaint"),
    executionStarted: t("visit.actions.executionStarted", "Execution already started ({state}) — cancel and reschedule are locked"),
    finalState: t("visit.actions.finalState", "final state — view only"),
    zoneAvailable: t("visit.actions.zoneAvailable", "Available now"),
    zoneBlocked: t("visit.actions.zoneBlocked", "Not available yet — why"),
    zoneUnavailable: t("visit.actions.zoneUnavailable", "Not available in this state"),
    reassignLockedWhy: t("visit.actions.reassignLockedWhy", "reassign locked — inspection already started ({state})"),
    scheduleLockedWhy: t("visit.actions.scheduleLockedWhy", "locked — execution already started ({state}). Only published, new visits can be rescheduled, changed, or cancelled"),
    noneAvailable: t("visit.actions.noneAvailable", "No management actions available in this state."),
    commentsHint: t("visit.actions.commentsHint", "mandatory when the reason is Other"),
    repackageLabel: t("visit.actions.repackageLabel", "New primary checklist (returned)"),
    repackageBtn: t("visit.actions.repackageBtn", "Change checklist"),
    duplicateBtn: t("visit.actions.duplicateBtn", "Duplicate visit"),
    duplicateWhy: t("visit.actions.duplicateWhy", "Duplicate creates a new Draft with planning fields only."),
    cutoffTitle: t("visit.actions.cutoffTitle", "Cutoff for cancelling and rescheduling"),
    cutoffBody: t(
      "visit.actions.cutoffBody",
      "The system checks the visit window again when you submit. You can cancel or reschedule until {cutoff} (Asia/Riyadh). Reassignment has no time limit.",
    ),
  };
  // CD-027 — Dual-State Ribbon: five never-collapsed domains, each with the
  // latest VERIFIED event + its source + the allowed-action boundary + a history
  // anchor. Boundaries are derived from the same guards the server actions enforce.
  const fmt = (iso: string) => formatDateTime(iso, locale);
  const preStart = !insp || insp.status === "not_started";
  const canManage = v.planning_status === "published" && v.operational_state === "new";
  // Supervisor-only and pre-start. The server repeats this via the atomic
  // capability, state and overlap checks before it writes anything.
  const canReassign = derived.canReassign;
  const isFinal = ["cancelled", "expired"].includes(v.planning_status);
  const latestAudit = (auditRows ?? [])[0];
  const geoEvents = journeys.flatMap(j => j.geo_events).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  const latestGeo = geoEvents[0];
  const latestSub = insp ? [...insp.submission_versions].sort((a, b) => b.version_number - a.version_number)[0] : undefined;
  const reviews = insp?.reviews ?? [];
  const latestReview = reviews[reviews.length - 1];
  const noEvt = t("visit.ribbon.noEvent", "no verified event yet");
  const planningBoundary = canManage
    ? t("visit.ribbon.b.manage", "Return · reschedule · change type · cancel")
    : v.planning_status === "returned" ? t("visit.ribbon.b.returned", "Republish · correct · cancel")
    : v.planning_status === "published" ? t("visit.ribbon.b.locked", "Return only — execution has started; you can't reassign this visit")
    : t("visit.ribbon.b.none", "None — final state, view only");
  const ribbonTracks: RibbonTrack[] = [
    { id: "planning", domainLabel: t("visit.ribbon.planning", "Planning"),
      stateLabel: t(`enum.${v.planning_status}`, v.planning_status), tone: PLAN_TONE[v.planning_status] ?? "",
      eventLabel: latestAudit ? `${t(`enum.audit.${latestAudit.action}`, latestAudit.action)} · ${fmt(latestAudit.occurred_at)}` : noEvt,
      sourceLabel: t("visit.ribbon.src.audit", "append-only audit trail"),
      boundaryLabel: planningBoundary, anchorHref: "#audit", anchorLabel: t("visit.ribbon.a.audit", "Open planning history") },
    { id: "operational", domainLabel: t("visit.ribbon.operational", "Visit status"),
      stateLabel: t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " ")), tone: "",
      eventLabel: latestGeo ? `${t(`enum.${latestGeo.kind}`, latestGeo.kind)} · ${fmt(latestGeo.occurred_at)}` : t("visit.ribbon.noJourney", "no journey yet"),
      sourceLabel: t("visit.ribbon.src.field", "field app / journey engine"),
      boundaryLabel: t("visit.ribbon.b.opRead", "Read-only here — owned by the field app (set_operational_state)"),
      anchorHref: "#journey", anchorLabel: t("visit.ribbon.a.journey", "Open journey & location") },
    { id: "assignment", domainLabel: t("visit.ribbon.assignment", "Assignment"),
      stateLabel: asg ? t(`enum.${asg.status}`, asg.status) : t("visit.ribbon.unassigned", "unassigned"), tone: asg ? "badge-info" : "",
      eventLabel: asg ? `${t(`enum.${asg.method}`, asg.method)} · ${asg.profiles?.full_name ?? "—"}` : t("visit.ribbon.noInspector", "no inspector assigned"),
      sourceLabel: t("visit.ribbon.src.assign", "assignment record"),
      boundaryLabel: canReassign ? t("visit.ribbon.b.reassign", "Reassign inspector (pre-start only)") : t("visit.ribbon.b.reassignLocked", "Read-only — reassignment locked"),
      anchorHref: "#config", anchorLabel: t("visit.ribbon.a.config", "Open assignment") },
    { id: "inspection", domainLabel: t("visit.ribbon.inspection", "Inspection"),
      stateLabel: insp ? t(`enum.${insp.status}`, insp.status.replace(/_/g, " ")) : t("enum.not_started", "not started"), tone: insp ? "badge-info" : "",
      eventLabel: latestSub ? `v${latestSub.version_number} · ${fmt(latestSub.submitted_at)} · ${t("visit.detail.immutable", "final")}` : t("visit.ribbon.noSub", "not submitted"),
      sourceLabel: t("visit.ribbon.src.insp", "inspection engine — submissions are final"),
      boundaryLabel: t("visit.ribbon.b.read", "Read-only here"), anchorHref: "#inspection", anchorLabel: t("visit.ribbon.a.insp", "Open inspection & versions") },
    { id: "review", domainLabel: t("visit.ribbon.review", "Review"),
      stateLabel: latestReview ? t(`enum.${latestReview.decision ?? latestReview.status}`, (latestReview.decision ?? latestReview.status).replace(/_/g, " ")) : t("visit.ribbon.noReview", "no review"),
      tone: latestReview?.decision === "approved" ? "badge-compliant" : latestReview?.decision === "rejected" ? "badge-critical" : latestReview ? "badge-warning" : "",
      eventLabel: latestReview?.returned_sections?.length ? `${t("visit.detail.returnedSections", "returned")} ${latestReview.returned_sections.join(", ")}` : (latestReview ? t(`enum.${latestReview.status}`, latestReview.status.replace(/_/g, " ")) : t("visit.ribbon.noReviewEvt", "review not started")),
      sourceLabel: t("visit.ribbon.src.review", "review engine"),
      boundaryLabel: t("visit.ribbon.b.read", "Read-only here"), anchorHref: "#inspection", anchorLabel: t("visit.ribbon.a.review", "Open review outcome") },
  ];
  const ribbonStrings: RibbonStrings = {
    heading: t("visit.ribbon.heading", "Lifecycle — five state domains"),
    tablistLabel: t("visit.ribbon.tablist", "Visit state domains"),
    stateWord: t("visit.ribbon.stateWord", "State"),
    latestWord: t("visit.ribbon.latestWord", "Latest verified event"),
    sourceWord: t("visit.ribbon.sourceWord", "Source of truth"),
    boundaryWord: t("visit.ribbon.boundaryWord", "Allowed from here"),
  };
  const cutoffInstant = new Date(new Date(v.window_start).getTime() - 720 * 60 * 60 * 1000);
  const cutoffDisplay = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  }).format(cutoffInstant);
  return (
    <Shell current={shellCurrent} title={t("visit.detail.title", "Visit {id} — {factory}").replace("{id}", v.id.slice(0, 8)).replace("{factory}", f?.name ?? "—")}
      context={<>
        {/* M02-002 — full lifecycle: planning status + operational state */}
        <span className={`badge ${PLAN_BADGE[v.planning_status] ?? "badge-pending"}`}>{t(`enum.${v.planning_status}`, v.planning_status)}</span>
        <span className="badge badge-info">{t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " "))}</span>
        {pkg && <span className="badge badge-outline">{pkg.packages?.code ?? "—"} · {pkg.version_label}</span>}
        {isUnverifiedManual && <span className="badge badge-warning">{tr("visit.detail.unverifiedManual", "Unverified manual entry — pending reconciliation", "إدخال يدوي غير موثّق — بانتظار المطابقة")}</span>}
      </>}>
      {targetPreview && <div className="page-header" data-saqeel-design="WA-DES-045">
        <div className="stack"><h1>{t("visit.detail.title", "Visit {id} — {factory}").replace("{id}", v.id.slice(0, 8)).replace("{factory}", f?.name ?? "—")}</h1>
          <span className="id-code">{v.visit_reference ?? v.id}</span></div>
        <a className="btn btn-ghost" href={routeBase}>{t("visit.detail.backToVisits", "Visits")}</a>
      </div>}
      <CreatedToast created={created}
        registeredMessage={t("visit.detail.createdToast", "Visit created and dispatched.")}
        unregisteredMessage={t("visit.detail.createdToastUnregistered", "Unregistered establishment recorded and visit dispatched.")} />
      {/* CD-027 — signature interaction: Dual-State Ribbon (one per screen) */}
      <DualStateRibbon tracks={ribbonTracks} strings={ribbonStrings} />
      <div className="metric-strip">
        <section id="config">
          <h2 className="panel-title">{t("visit.detail.configuration", "Configuration")}</h2>
          <p>{t(`enum.${v.visit_type}`, v.visit_type)} · {t(`enum.${v.execution_mode}`, v.execution_mode)} · {t("visit.detail.window", "window")} <span className="id-code">{formatDateTime(v.window_start, locale)} → {formatDateTime(v.window_end, locale)}</span></p>
          <p>{t("visit.detail.assignment", "Assignment:")} <strong>{asg?.profiles?.full_name ?? "—"}</strong> ({asg ? t(`enum.${asg.method}`, asg.method) : "—"}) {f ? <> · <a className="btn btn-ghost btn-sm" href={`/factories/${f.id}`}>{t("visit.detail.factory360", "Factory 360")}</a></> : null}</p>

          {(v.immediate_creator_role || v.source_channel) && (
            <p className="t-caption">
              {t("visit.detail.immediateProvenance", "Urgent visit creation:")}{" "}
              {v.immediate_creator_role === "inspector"
                ? tr("visit.detail.creatorInspector", "Inspector — self-created", "المفتش — إنشاء ذاتي")
                : tr("visit.detail.creatorPlanner", "Planner", "المخطط")}
              {v.internal_reference ? <> · {t("visit.detail.manualReason", "manual reason")} <bdi>{v.internal_reference}</bdi></> : null}
              {v.source_channel ? <> · <bdi>{v.source_channel}</bdi></> : null}
            </p>
          )}
        </section>
        <section id="inspection">
          <h2 className="panel-title">{t("visit.detail.inspectionVersions", "Inspection & versions")}</h2>
          {insp ? (
            <div className="stack">
              <span className="badge badge-info">{t(`enum.${insp.status}`, insp.status.replace(/_/g, " "))}</span>
              {insp.submission_versions.sort((a, b) => a.version_number - b.version_number).map(s => (
                <p key={s.version_number} className="id-code"><span className="badge badge-outline">v{s.version_number}</span> {formatDateTime(s.submitted_at, locale)} · {t("visit.detail.immutable", "final")}</p>
              ))}
              {insp.reviews.map((r, i) => (
                <p key={i} className="t-caption">{t("visit.detail.reviewPrefix", "review:")} {r.decision ? t(`enum.${r.decision}`, r.decision) : t(`enum.${r.status}`, r.status.replace(/_/g, " "))}{r.returned_sections ? ` · ${t("visit.detail.returnedSections", "returned")} ${r.returned_sections.join(",")}` : ""}</p>
              ))}
              {/* M04-215 — official report (browser print-to-PDF is the production PDF path) */}
              <p><a className="btn btn-ghost" href={`/reports/inspection/${insp.id}`}>{t("visit.detail.reportLink", "Official inspection report")}</a></p>
            </div>
          ) : <p className="t-caption">{t("visit.detail.notStarted", "Not started.")}</p>}
        </section>
      </div>
      <div className="stack">
      {/* M02-005 — linked plan info: how this visit was planned, by whom, published when */}
      <section className="panel">
        <div className="panel-header"><h2 className="panel-title">{t("visit.detail.planHeading", "Linked plan")}</h2></div>
        <div className="panel-body">
        {plan ? (
          <p>
            <span className="badge badge-info">{t(`enum.${plan.method}`, plan.method)}</span>{" "}
            <span className="id-code"><strong>{plan.plan_reference ?? plan.id.slice(0, 8)}</strong></span> · {t("visit.detail.planCreatedBy", "created by")} <strong>{plan.profiles?.full_name ?? "—"}</strong>{" "}
            <span className="id-code">{formatDateTime(plan.created_at, locale)}</span>
            {plan.published_at && <> · {t("visit.detail.planPublishedAt", "published")} <span className="id-code">{formatDateTime(plan.published_at, locale)}</span></>}
            {" "}· <span className={`badge ${PLAN_BADGE[plan.status] ?? "badge-pending"}`}>{t(`enum.${plan.status}`, plan.status)}</span>
            {/* M8 — bulk context: this visit is one of N under the plan */}
            {" "}· {t("visit.detail.siblings", "{n} visits under this plan").replace("{n}", String(siblingCount))}
            {" "}· <a className="btn btn-ghost btn-sm" href={`/planning/plans/${plan.id}`}>{t("visit.detail.openPlan", "Open plan")}</a>
          </p>
        ) : (
          <p className="t-caption">{t("visit.detail.noPlan", "Urgent visit — created without a plan.")}</p>
        )}
        </div>
      </section>
      {/* M02-008/029 + M8 — return info from the lifecycle stream; the legacy
          notes-prefix parse only fires for historical rows without an event.
          M10 / PLN-REQ-009 — notification deep-links (?focus=return) anchor
          and highlight this block. */}
      {returnReason && (
        <div id="return-block" className="alert alert-warning" tabIndex={focus === "return" ? -1 : undefined}>
          {t("visit.detail.returnReason", "Returned — reason: {reason}").replace("{reason}", returnReason)}
          {latestReturnEvent?.comments ? <> · <bdi>{latestReturnEvent.comments}</bdi></> : null}
          {latestReturnEvent ? <span className="t-caption"> · {formatDateTime(latestReturnEvent.created_at, locale)}</span> : null}
        </div>
      )}
      {focus === "return" && returnReason ? <FocusScroll targetId="return-block" /> : null}
      {v.planning_status === "cancelled" && cancelReasonDisplay && (
        <div className="alert alert-critical">
          {t("visit.detail.cancelledReason", "Cancelled — reason: {reason} (final)").replace("{reason}", cancelReasonDisplay)}
          {latestCancelEvent?.comments ? <> · <bdi>{latestCancelEvent.comments}</bdi></> : null}
        </div>
      )}
      {/* M8 — expiry provenance: rule reason + event comments, final/read-only */}
      {v.planning_status === "expired" && (
        <div className="alert alert-immutable">
          {t("visit.detail.expiredReason", "Expired — {reason} (final; duplicate produces a new Draft)")
            .replace("{reason}", expiryRuleReason ?? t("visit.detail.expiredUnknown", "lapsed by the scheduled expiry sweep"))}
        </div>
      )}
      {/* FIX WAVE F4 — M02-043 notes add/edit */}
      <NotesEditor visitId={v.id} planningVersion={v.planning_version} initialNotes={typeof v.notes === "string" ? v.notes : ""} strings={notesStrings} />
      {/* FIX WAVE F4 — M02-042 attachments */}
      {attErr ? (
        <div className="alert alert-critical" role="alert">{mapError(null, "load")}</div>
      ) : (
        <Attachments visitId={v.id} rows={attRows} strings={attachmentsStrings} />
      )}
      {/* M8 / PLN-CON-003 — report packages: every visit_packages link with its
          immutable snapshot; the primary (visits.package_version_id) is marked.
          Zero links = preparation chooses the checklist later (honest, allowed). */}
      <section id="packages" className="panel">
        <div className="panel-header"><h2 className="panel-title">{t("visit.detail.packagesHeading", "Checklists used")}</h2></div>
        <div className="panel-body">
        {pkgLinks.length === 0 ? (
          <p className="t-caption">{t("visit.detail.noPackages", "No checklist selected — the inspector chooses an eligible checklist during preparation.")}</p>
        ) : (
          <ul className="timeline">
            {pkgLinks.map(l => (
              <li key={l.id}>
                <span className={l.package_version_id === v.package_version_id ? "tl-dot is-accent" : "tl-dot"} />
                <div>
                  <strong>{snapshotText(l.snapshot, "code") ?? l.package_version_id.slice(0, 8)}</strong>
                  {snapshotText(l.snapshot, "title") ? <> · {snapshotText(l.snapshot, "title")}</> : null}
                  {snapshotText(l.snapshot, "version_label") ? <> · <span className="badge badge-outline">{snapshotText(l.snapshot, "version_label")}</span></> : null}
                  {l.package_version_id === v.package_version_id && <span className="badge badge-info">{t("visit.detail.primaryPackage", "primary")}</span>}
                  <br />
                  <span className="tl-meta id-code">
                    {t("visit.detail.packageLinkedAt", "linked")} {formatDateTime(l.added_at, locale)}
                    {snapshotText(l.snapshot, "status") ? <> · {t("visit.detail.packageSnapshot", "snapshot at link time:")} {snapshotText(l.snapshot, "status")}</> : null}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        </div>
      </section>
      {/* M8 / PLN-CON-011 — lifecycle history: the append-only event stream
          (return/cancel/republish/expire/duplicate/reschedule/reassign/
          discard_draft), reasons resolved through the governed lookups. */}
      <section id="lifecycle" className="panel">
        <div className="panel-header"><h2 className="panel-title">{t("visit.detail.lifecycleHeading", "Lifecycle history — append-only")}</h2></div>
        <div className="panel-body">
        {lifecycleEvents.length === 0 ? (
          <p className="t-caption">{t("visit.detail.noLifecycle", "No lifecycle events recorded yet.")}</p>
        ) : (
          <ul className="timeline">
            {lifecycleEvents.map(e => {
              const label = e.event_type === "return" ? reasonLabel(returnReasons, e.reason_key)
                : e.event_type === "cancel" ? reasonLabel(cancelReasons, e.reason_key)
                : e.reason_key;
              return (
                <li key={e.id}>
                  <span className={["return", "cancel", "expire"].includes(e.event_type) ? "tl-dot is-accent" : "tl-dot"} />
                  <div>
                    <strong>{t(`enum.lifecycle.${e.event_type}`, e.event_type.replace(/_/g, " "))}</strong>
                    {label ? <> · {label}</> : null}
                    {e.comments ? <> · <bdi>{e.comments}</bdi></> : null}
                    <br />
                    <span className="tl-meta id-code">
                      {formatDateTime(e.created_at, locale)} · {e.actor ? t("visit.detail.auditActor", "by {who}").replace("{who}", e.actor.slice(0, 8)) : t("visit.detail.auditSystem", "system")}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        </div>
      </section>
      {/* M8 — location provenance: current planned pin, first pin, and the
          additive visit_location_events stream (canonical §12). */}
      <section id="location" className="panel">
        <div className="panel-header"><h2 className="panel-title">{t("visit.detail.locationHeading", "Location & provenance")}</h2></div>
        <div className="panel-body">
        <p className="id-code">
          {t("visit.detail.locationPlanned", "Planned pin:")}{" "}
          {v.planner_lat != null && v.planner_lng != null ? `${v.planner_lat}, ${v.planner_lng}` : t("visit.detail.locationFactory", "factory location")}
          {v.visit_location_source ? <> · {t(`enum.locationSource.${v.visit_location_source}`, v.visit_location_source)}</> : null}
          {v.original_lat != null && v.original_lng != null && (v.original_lat !== v.planner_lat || v.original_lng !== v.planner_lng) && (
            <> · {t("visit.detail.locationOriginal", "first pin:")} {v.original_lat}, {v.original_lng}</>
          )}
        </p>
        {locationEvents.length > 0 && (
          <ul className="timeline">
            {locationEvents.map(e => (
              <li key={e.id}>
                <span className="tl-dot" />
                <div>
                  <strong>{t(`enum.locationSource.${e.source}`, e.source)}</strong> · <span className="id-code">{e.lat}, {e.lng}</span>
                  {e.note ? <> · <bdi>{e.note}</bdi></> : null}
                  <br />
                  <span className="tl-meta id-code">
                    {formatDateTime(e.created_at, locale)} · {e.actor ? t("visit.detail.auditActor", "by {who}").replace("{who}", e.actor.slice(0, 8)) : t("visit.detail.auditSystem", "system")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        </div>
      </section>
      <section id="journey" className="panel">
        <div className="panel-header"><h2 className="panel-title">{t("visit.detail.journeyHeading", "Journey & location events — cannot be edited")}</h2></div>
        <div className="panel-body">
        <ul className="timeline">
          {journeys.flatMap(j => j.geo_events.map(g => (
            <li key={g.occurred_at}>
              <span className={g.kind === "checkin" ? "tl-dot is-accent" : "tl-dot"} />
              <div><strong>{t(`enum.${g.kind}`, g.kind)}</strong> · ±{g.accuracy_m} m {g.geofence_result && <span className="badge badge-compliant">{t(`enum.${g.geofence_result}`, g.geofence_result)}</span>}<br />
                <span className="tl-meta id-code">{formatDateTime(g.occurred_at, locale)} · gis {g.gis_version}</span></div>
            </li>
          )))}
          {journeys.length === 0 && <p className="t-caption">{t("visit.detail.noJourney", "No journey yet.")}</p>}
        </ul>
        </div>
      </section>
      <section id="audit" className="panel">
        <div className="panel-header"><h2 className="panel-title">{t("visit.detail.auditHeading", "Planning history — cannot be edited, only added to (latest 30)")}</h2></div>
        <div className="panel-body">
        <ul className="timeline">
          {(auditRows ?? []).map(a => (
            <li key={a.id}>
              <span className="tl-dot" />
              <div><strong>{t(`enum.audit.${a.action}`, a.action)}</strong> · {a.actor ? t("visit.detail.auditActor", "by {who}").replace("{who}", a.actor.slice(0, 8)) : t("visit.detail.auditSystem", "system")}<br />
                <span className="tl-meta id-code">{formatDateTime(a.occurred_at, locale)}</span></div>
            </li>
          ))}
          {(auditRows ?? []).length === 0 && <p className="t-caption">{t("visit.detail.noAudit", "No audited changes yet, or you don't have audit-read access.")}</p>}
        </ul>
        </div>
      </section>
      <aside className="stack">
        <ActionBar visitId={v.id} planningVersion={v.planning_version} status={v.planning_status} opState={v.operational_state}
          opStateLabel={t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " "))}
          visitType={v.visit_type} windowStart={v.window_start} windowEnd={v.window_end} inspectors={inspectors}
          canManage={canManage} canReassign={canReassign} isFinal={isFinal}
          returnReasons={returnReasons} cancelReasons={cancelReasons} packageOptions={packageOptions}
          cutoffDisplay={cutoffDisplay} strings={actionStrings} />
      </aside>
      </div>
    </Shell>
  );
}
