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
import { getMessages } from "@/i18n/messages";
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
  const V = getMessages(locale).visits;
  const page = await loadVisitDetail(id);
  if (page.kind === "error") {
    return <Shell current={shellCurrent} title={V.detail.errorTitle}><div className="alert alert-critical" role="alert">{mapError(null, "load")}</div></Shell>;
  }
  if (page.kind === "not-found") {
    return <Shell current={shellCurrent} title={V.detail.notFoundTitle}>
      <EmptyState glyph="∅" title={V.detail.notFound}
        body={V.detail.notFoundDesc} />
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
    heading: V.att.heading,
    empty: V.att.empty,
    colFile: V.att.colFile,
    colType: V.att.colType,
    colUploaded: V.att.colUploaded,
    colBy: V.att.colBy,
    colActions: V.att.colActions,
    download: V.att.download,
    remove: V.att.remove,
    removeAria: V.att.removeAria,
    fileLabel: V.att.fileLabel,
    uploadBtn: V.att.uploadBtn,
    uploading: V.att.uploading,
    urlFailed: V.att.urlFailed,
  };
  const notesStrings: NotesStrings = {
    heading: V.notes.heading,
    label: V.notes.label,
    placeholder: V.notes.placeholder,
    saveBtn: V.notes.saveBtn,
    saving: V.notes.saving,
    hint: V.notes.hint,
  };
  const actionStrings: ActionBarStrings = {
    heading: V.actions.heading,
    returnReason: V.actions.returnReason,
    returnComments: V.actions.returnComments,
    returnBtn: V.actions.returnBtn,
    republishBtn: V.actions.republishBtn,
    reassignTo: V.actions.reassignTo,
    reassignReason: V.actions.reassignReason,
    reassignBtn: V.actions.reassignBtn,
    newWindowStart: V.actions.newWindowStart,
    newWindowEnd: V.actions.newWindowEnd,
    rescheduleBtn: V.actions.rescheduleBtn,
    cancelReason: V.actions.cancelReason,
    cancelComments: V.actions.cancelComments,
    cancelBtn: V.actions.cancelBtn,
    visitTypeLabel: V.actions.visitTypeLabel,
    visitTypeBtn: V.actions.visitTypeBtn,
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    typeFollowUp: t("enum.follow_up", "Follow-up"),
    typeComplaint: t("enum.complaint", "Complaint"),
    executionStarted: V.actions.executionStarted,
    finalState: V.actions.finalState,
    zoneAvailable: V.actions.zoneAvailable,
    zoneBlocked: V.actions.zoneBlocked,
    zoneUnavailable: V.actions.zoneUnavailable,
    reassignLockedWhy: V.actions.reassignLockedWhy,
    scheduleLockedWhy: V.actions.scheduleLockedWhy,
    noneAvailable: V.actions.noneAvailable,
    commentsHint: V.actions.commentsHint,
    repackageLabel: V.actions.repackageLabel,
    repackageBtn: V.actions.repackageBtn,
    duplicateBtn: V.actions.duplicateBtn,
    duplicateWhy: V.actions.duplicateWhy,
    cutoffTitle: V.actions.cutoffTitle,
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
  const noEvt = V.ribbon.noEvent;
  const planningBoundary = canManage
    ? V.ribbon.b.manage
    : v.planning_status === "returned" ? V.ribbon.b.returned
    : v.planning_status === "published" ? V.ribbon.b.locked
    : V.ribbon.b.none;
  const ribbonTracks: RibbonTrack[] = [
    { id: "planning", domainLabel: V.ribbon.planning,
      stateLabel: t(`enum.${v.planning_status}`, v.planning_status), tone: PLAN_TONE[v.planning_status] ?? "",
      eventLabel: latestAudit ? `${t(`enum.audit.${latestAudit.action}`, latestAudit.action)} · ${fmt(latestAudit.occurred_at)}` : noEvt,
      sourceLabel: V.ribbon.src.audit,
      boundaryLabel: planningBoundary, anchorHref: "#audit", anchorLabel: V.ribbon.a.audit },
    { id: "operational", domainLabel: V.ribbon.operational,
      stateLabel: t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " ")), tone: "",
      eventLabel: latestGeo ? `${t(`enum.${latestGeo.kind}`, latestGeo.kind)} · ${fmt(latestGeo.occurred_at)}` : V.ribbon.noJourney,
      sourceLabel: V.ribbon.src.field,
      boundaryLabel: V.ribbon.b.opRead,
      anchorHref: "#journey", anchorLabel: V.ribbon.a.journey },
    { id: "assignment", domainLabel: V.ribbon.assignment,
      stateLabel: asg ? t(`enum.${asg.status}`, asg.status) : V.ribbon.unassigned, tone: asg ? "badge-info" : "",
      eventLabel: asg ? `${t(`enum.${asg.method}`, asg.method)} · ${asg.profiles?.full_name ?? "—"}` : V.ribbon.noInspector,
      sourceLabel: V.ribbon.src.assign,
      boundaryLabel: canReassign ? V.ribbon.b.reassign : V.ribbon.b.reassignLocked,
      anchorHref: "#config", anchorLabel: V.ribbon.a.config },
    { id: "inspection", domainLabel: V.ribbon.inspection,
      stateLabel: insp ? t(`enum.${insp.status}`, insp.status.replace(/_/g, " ")) : t("enum.not_started", "not started"), tone: insp ? "badge-info" : "",
      eventLabel: latestSub ? `v${latestSub.version_number} · ${fmt(latestSub.submitted_at)} · ${V.detail.immutable}` : V.ribbon.noSub,
      sourceLabel: V.ribbon.src.insp,
      boundaryLabel: V.ribbon.b.read, anchorHref: "#inspection", anchorLabel: V.ribbon.a.insp },
    { id: "review", domainLabel: V.ribbon.review,
      stateLabel: latestReview ? t(`enum.${latestReview.decision ?? latestReview.status}`, (latestReview.decision ?? latestReview.status).replace(/_/g, " ")) : V.ribbon.noReview,
      tone: latestReview?.decision === "approved" ? "badge-compliant" : latestReview?.decision === "rejected" ? "badge-critical" : latestReview ? "badge-warning" : "",
      eventLabel: latestReview?.returned_sections?.length ? `${V.detail.returnedSections} ${latestReview.returned_sections.join(", ")}` : (latestReview ? t(`enum.${latestReview.status}`, latestReview.status.replace(/_/g, " ")) : V.ribbon.noReviewEvt),
      sourceLabel: V.ribbon.src.review,
      boundaryLabel: V.ribbon.b.read, anchorHref: "#inspection", anchorLabel: V.ribbon.a.review },
  ];
  const ribbonStrings: RibbonStrings = {
    heading: V.ribbon.heading,
    tablistLabel: V.ribbon.tablist,
    stateWord: V.ribbon.stateWord,
    latestWord: V.ribbon.latestWord,
    sourceWord: V.ribbon.sourceWord,
    boundaryWord: V.ribbon.boundaryWord,
  };
  const cutoffDisplay = derived.cutoffDisplay;
  return (
    <Shell current={shellCurrent} title={V.detail.title.replace("{id}", v.id.slice(0, 8)).replace("{factory}", f?.name ?? "—")}
      context={<>
        {/* M02-002 — full lifecycle: planning status + operational state */}
        <span className={`badge ${PLAN_BADGE[v.planning_status] ?? "badge-pending"}`}>{t(`enum.${v.planning_status}`, v.planning_status)}</span>
        <span className="badge badge-info">{t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " "))}</span>
        {pkg && <span className="badge badge-outline">{pkg.packages?.code ?? "—"} · {pkg.version_label}</span>}
        {isUnverifiedManual && <span className="badge badge-warning">{V.detail.unverifiedManual}</span>}
      </>}>
      {targetPreview && <div className="page-header" data-saqeel-design="WA-DES-045">
        <div className="stack"><h1>{V.detail.title.replace("{id}", v.id.slice(0, 8)).replace("{factory}", f?.name ?? "—")}</h1>
          <span className="id-code">{v.visit_reference ?? v.id}</span></div>
        <a className="btn btn-ghost" href={routeBase}>{V.detail.backToVisits}</a>
      </div>}
      <CreatedToast created={created}
        registeredMessage={V.detail.createdToast}
        unregisteredMessage={V.detail.createdToastUnregistered} />
      {/* CD-027 — signature interaction: Dual-State Ribbon (one per screen) */}
      <DualStateRibbon tracks={ribbonTracks} strings={ribbonStrings} />
      <div className="metric-strip">
        <section id="config">
          <h2 className="panel-title">{V.detail.configuration}</h2>
          <p>{t(`enum.${v.visit_type}`, v.visit_type)} · {t(`enum.${v.execution_mode}`, v.execution_mode)} · {V.detail.window} <span className="id-code">{formatDateTime(v.window_start, locale)} → {formatDateTime(v.window_end, locale)}</span></p>
          <p>{V.detail.assignment} <strong>{asg?.profiles?.full_name ?? "—"}</strong> ({asg ? t(`enum.${asg.method}`, asg.method) : "—"}) {f ? <> · <a className="btn btn-ghost btn-sm" href={`/factories/${f.id}`}>{V.detail.factory360}</a></> : null}</p>

          {(v.immediate_creator_role || v.source_channel) && (
            <p className="t-caption">
              {V.detail.immediateProvenance}{" "}
              {v.immediate_creator_role === "inspector"
                ? V.detail.creatorInspector
                : V.detail.creatorPlanner}
              {v.internal_reference ? <> · {V.detail.manualReason} <bdi>{v.internal_reference}</bdi></> : null}
              {v.source_channel ? <> · <bdi>{v.source_channel}</bdi></> : null}
            </p>
          )}
        </section>
        <section id="inspection">
          <h2 className="panel-title">{V.detail.inspectionVersions}</h2>
          {insp ? (
            <div className="stack">
              <span className="badge badge-info">{t(`enum.${insp.status}`, insp.status.replace(/_/g, " "))}</span>
              {insp.submission_versions.sort((a, b) => a.version_number - b.version_number).map(s => (
                <p key={s.version_number} className="id-code"><span className="badge badge-outline">v{s.version_number}</span> {formatDateTime(s.submitted_at, locale)} · {V.detail.immutable}</p>
              ))}
              {insp.reviews.map((r, i) => (
                <p key={i} className="t-caption">{V.detail.reviewPrefix} {r.decision ? t(`enum.${r.decision}`, r.decision) : t(`enum.${r.status}`, r.status.replace(/_/g, " "))}{r.returned_sections ? ` · ${V.detail.returnedSections} ${r.returned_sections.join(",")}` : ""}</p>
              ))}
              {/* M04-215 — official report (browser print-to-PDF is the production PDF path) */}
              <p><a className="btn btn-ghost" href={`/reports/inspection/${insp.id}`}>{V.detail.reportLink}</a></p>
            </div>
          ) : <p className="t-caption">{V.detail.notStarted}</p>}
        </section>
      </div>
      <div className="stack">
      {/* M02-005 — linked plan info: how this visit was planned, by whom, published when */}
      <section className="panel">
        <div className="panel-header"><h2 className="panel-title">{V.detail.planHeading}</h2></div>
        <div className="panel-body">
        {plan ? (
          <p>
            <span className="badge badge-info">{t(`enum.${plan.method}`, plan.method)}</span>{" "}
            <span className="id-code"><strong>{plan.plan_reference ?? plan.id.slice(0, 8)}</strong></span> · {V.detail.planCreatedBy} <strong>{plan.profiles?.full_name ?? "—"}</strong>{" "}
            <span className="id-code">{formatDateTime(plan.created_at, locale)}</span>
            {plan.published_at && <> · {V.detail.planPublishedAt} <span className="id-code">{formatDateTime(plan.published_at, locale)}</span></>}
            {" "}· <span className={`badge ${PLAN_BADGE[plan.status] ?? "badge-pending"}`}>{t(`enum.${plan.status}`, plan.status)}</span>
            {/* M8 — bulk context: this visit is one of N under the plan */}
            {" "}· {V.detail.siblings.replace("{n}", String(siblingCount))}
            {" "}· <a className="btn btn-ghost btn-sm" href={`/planning/plans/${plan.id}`}>{V.detail.openPlan}</a>
          </p>
        ) : (
          <p className="t-caption">{V.detail.noPlan}</p>
        )}
        </div>
      </section>
      {/* M02-008/029 + M8 — return info from the lifecycle stream; the legacy
          notes-prefix parse only fires for historical rows without an event.
          M10 / PLN-REQ-009 — notification deep-links (?focus=return) anchor
          and highlight this block. */}
      {returnReason && (
        <div id="return-block" className="alert alert-warning" tabIndex={focus === "return" ? -1 : undefined}>
          {V.detail.returnReason.replace("{reason}", returnReason)}
          {latestReturnEvent?.comments ? <> · <bdi>{latestReturnEvent.comments}</bdi></> : null}
          {latestReturnEvent ? <span className="t-caption"> · {formatDateTime(latestReturnEvent.created_at, locale)}</span> : null}
        </div>
      )}
      {focus === "return" && returnReason ? <FocusScroll targetId="return-block" /> : null}
      {v.planning_status === "cancelled" && cancelReasonDisplay && (
        <div className="alert alert-critical">
          {V.detail.cancelledReason.replace("{reason}", cancelReasonDisplay)}
          {latestCancelEvent?.comments ? <> · <bdi>{latestCancelEvent.comments}</bdi></> : null}
        </div>
      )}
      {/* M8 — expiry provenance: rule reason + event comments, final/read-only */}
      {v.planning_status === "expired" && (
        <div className="alert alert-immutable">
          {V.detail.expiredReason
            .replace("{reason}", expiryRuleReason ?? V.detail.expiredUnknown)}
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
        <div className="panel-header"><h2 className="panel-title">{V.detail.packagesHeading}</h2></div>
        <div className="panel-body">
        {pkgLinks.length === 0 ? (
          <p className="t-caption">{V.detail.noPackages}</p>
        ) : (
          <ul className="timeline">
            {pkgLinks.map(l => (
              <li key={l.id}>
                <span className={l.package_version_id === v.package_version_id ? "tl-dot is-accent" : "tl-dot"} />
                <div>
                  <strong>{snapshotText(l.snapshot, "code") ?? l.package_version_id.slice(0, 8)}</strong>
                  {snapshotText(l.snapshot, "title") ? <> · {snapshotText(l.snapshot, "title")}</> : null}
                  {snapshotText(l.snapshot, "version_label") ? <> · <span className="badge badge-outline">{snapshotText(l.snapshot, "version_label")}</span></> : null}
                  {l.package_version_id === v.package_version_id && <span className="badge badge-info">{V.detail.primaryPackage}</span>}
                  <br />
                  <span className="tl-meta id-code">
                    {V.detail.packageLinkedAt} {formatDateTime(l.added_at, locale)}
                    {snapshotText(l.snapshot, "status") ? <> · {V.detail.packageSnapshot} {snapshotText(l.snapshot, "status")}</> : null}
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
        <div className="panel-header"><h2 className="panel-title">{V.detail.lifecycleHeading}</h2></div>
        <div className="panel-body">
        {lifecycleEvents.length === 0 ? (
          <p className="t-caption">{V.detail.noLifecycle}</p>
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
                      {formatDateTime(e.created_at, locale)} · {e.actor ? V.detail.auditActor.replace("{who}", e.actor.slice(0, 8)) : V.detail.auditSystem}
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
        <div className="panel-header"><h2 className="panel-title">{V.detail.locationHeading}</h2></div>
        <div className="panel-body">
        <p className="id-code">
          {V.detail.locationPlanned}{" "}
          {v.planner_lat != null && v.planner_lng != null ? `${v.planner_lat}, ${v.planner_lng}` : V.detail.locationFactory}
          {v.visit_location_source ? <> · {t(`enum.locationSource.${v.visit_location_source}`, v.visit_location_source)}</> : null}
          {v.original_lat != null && v.original_lng != null && (v.original_lat !== v.planner_lat || v.original_lng !== v.planner_lng) && (
            <> · {V.detail.locationOriginal} {v.original_lat}, {v.original_lng}</>
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
                    {formatDateTime(e.created_at, locale)} · {e.actor ? V.detail.auditActor.replace("{who}", e.actor.slice(0, 8)) : V.detail.auditSystem}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        </div>
      </section>
      <section id="journey" className="panel">
        <div className="panel-header"><h2 className="panel-title">{V.detail.journeyHeading}</h2></div>
        <div className="panel-body">
        <ul className="timeline">
          {journeys.flatMap(j => j.geo_events.map(g => (
            <li key={g.occurred_at}>
              <span className={g.kind === "checkin" ? "tl-dot is-accent" : "tl-dot"} />
              <div><strong>{t(`enum.${g.kind}`, g.kind)}</strong> · ±{g.accuracy_m} m {g.geofence_result && <span className="badge badge-compliant">{t(`enum.${g.geofence_result}`, g.geofence_result)}</span>}<br />
                <span className="tl-meta id-code">{formatDateTime(g.occurred_at, locale)} · gis {g.gis_version}</span></div>
            </li>
          )))}
          {journeys.length === 0 && <p className="t-caption">{V.detail.noJourney}</p>}
        </ul>
        </div>
      </section>
      <section id="audit" className="panel">
        <div className="panel-header"><h2 className="panel-title">{V.detail.auditHeading}</h2></div>
        <div className="panel-body">
        <ul className="timeline">
          {(auditRows ?? []).map(a => (
            <li key={a.id}>
              <span className="tl-dot" />
              <div><strong>{t(`enum.audit.${a.action}`, a.action)}</strong> · {a.actor ? V.detail.auditActor.replace("{who}", a.actor.slice(0, 8)) : V.detail.auditSystem}<br />
                <span className="tl-meta id-code">{formatDateTime(a.occurred_at, locale)}</span></div>
            </li>
          ))}
          {(auditRows ?? []).length === 0 && <p className="t-caption">{V.detail.noAudit}</p>}
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
