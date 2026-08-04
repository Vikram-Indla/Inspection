import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import ActionBar, { type ActionBarStrings, type PackageOption } from "./ActionBar";
import Attachments, { type AttachmentRow, type AttachmentsStrings } from "./Attachments";
import NotesEditor, { type NotesStrings } from "./NotesEditor";
import DualStateRibbon, { type RibbonTrack, type RibbonStrings } from "./DualStateRibbon";
import { getReasonOptions, type ReasonOption } from "@/lib/planning/lifecycle";
import { mapError } from "./neutral";
import CreatedToast from "@/components/CreatedToast";
import EmptyState from "@/components/EmptyState";
import FocusScroll from "./FocusScroll";
import { getPlanningAccess } from "@/lib/planning/access";

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
  const sb = await supabaseServer();
  const planningAccess = await getPlanningAccess(sb, ["planning.reassign"]);
  const { data: rosterRows, error: rosterError } = await sb.rpc(
    "list_available_reassignment_inspectors", { p_visit_ids: [id] },
  );
  if (rosterError) console.error(`[visit.reassignment-roster] load failed: ${rosterError.message}`);
  const inspectors = (rosterRows ?? []).map((r: { inspector_id: string; full_name: string }) => ({
    user_id: r.inspector_id as string,
    full_name: r.full_name as string,
  }));
  const { data: v, error: vErr } = await sb.from("visits")
    .select(`id, visit_type, execution_mode, planning_status, planning_version, operational_state, window_start, window_end, cancellation_reason, notes,
      immediate_creator_role, source_channel, internal_reference, priority, visit_reference, expired_by_rule_id, package_version_id,
      planner_lat, planner_lng, original_lat, original_lng, visit_location_source, created_at,
      visit_plans(id, method, status, published_at, created_at, plan_reference, profiles!visit_plans_created_by_fkey(full_name)),
      factories(id, factory_code, name, cr_number, official_lat, official_lng, risk_band, is_temporary, source),
      package_versions(version_label, packages(code)),
      assignments(method, status, profiles(full_name)),
      journey_sessions(id, started_at, geo_events(kind, accuracy_m, geofence_result, gis_version, occurred_at)),
      inspections(id, status, submission_versions(version_number, submitted_at), reviews(decision, status, returned_sections))`)
    .eq("id", id).maybeSingle();
  // ENG-12 — the append-only audit trigger already records every status
  // transition on this row (publish/return/republish/cancel/reassign/
  // reschedule/expire); it just wasn't surfaced per-visit before, only via
  // the separate global /admin/audit browser. RLS-gated same as that browser.
  const { data: auditRows } = await sb.from("audit_events")
    .select("id, actor, action, before_state, after_state, occurred_at")
    .eq("object_type", "visits").eq("object_id", id)
    .order("occurred_at", { ascending: false }).limit(30);
  // M8 / PLN-CON-011 — governed lifecycle stream + location provenance +
  // package links. All three are additive reads; a failed read degrades to an
  // empty section (logged), never a crashed page.
  const [lifecycleRead, locationRead, pkgLinksRead, returnReasonsRes, cancelReasonsRes] = await Promise.all([
    sb.from("visit_lifecycle_events")
      .select("id, event_type, reason_key, comments, actor, previous, created_at")
      .eq("visit_id", id).order("created_at", { ascending: false }).limit(50),
    sb.from("visit_location_events")
      .select("id, lat, lng, source, actor, note, created_at")
      .eq("visit_id", id).order("created_at", { ascending: false }).limit(50),
    sb.from("visit_packages")
      .select("id, package_version_id, snapshot, added_at")
      .eq("visit_id", id).order("added_at", { ascending: true }),
    getReasonOptions(sb, "return_reason"),
    getReasonOptions(sb, "cancellation_reason"),
  ]);
  if (lifecycleRead.error) console.error("[visit.detail] lifecycle read:", lifecycleRead.error.message);
  if (locationRead.error) console.error("[visit.detail] location events read:", locationRead.error.message);
  if (pkgLinksRead.error) console.error("[visit.detail] visit_packages read:", pkgLinksRead.error.message);
  const lifecycleEvents = (lifecycleRead.data ?? []) as {
    id: string; event_type: string; reason_key: string | null; comments: string | null;
    actor: string | null; previous: Record<string, unknown>; created_at: string;
  }[];
  const locationEvents = (locationRead.data ?? []) as {
    id: string; lat: number; lng: number; source: string; actor: string | null; note: string | null; created_at: string;
  }[];
  const pkgLinks = (pkgLinksRead.data ?? []) as {
    id: string; package_version_id: string; added_at: string;
    snapshot: { code?: string | null; title?: string | null; version_label?: string | null; status?: string | null } | null;
  }[];
  if (vErr) {
    return <Shell current={shellCurrent} title={t("visit.detail.errorTitle", "Visit — error")}><div className="alert alert-critical" role="alert">{mapError(vErr, "load")}</div></Shell>;
  }
  if (!v) {
    return <Shell current={shellCurrent} title={t("visit.detail.notFoundTitle", "Visit not found")}>
      <EmptyState glyph="∅" title={t("visit.detail.notFound", "Not in your scope or does not exist")}
        body={t("visit.detail.notFoundDesc", "IDs never change or get reused (FLD-VIS-001).")} />
    </Shell>;
  }
  const f = v.factories as unknown as { id: string; factory_code: string; name: string; cr_number: string; risk_band: string; is_temporary: boolean; source: string | null };
  // PLN-REQ-028 — a manual immediate factory is never presented as master data:
  // the unverified marker rides next to the lifecycle lozenges, and creator
  // provenance (Planner/Inspector, reason, channel) is surfaced below.
  const isUnverifiedManual = f.is_temporary && f.source === "immediate_manual";
  // visits->visit_plans is TO-ONE (FK on visits): object or null (null = immediate, M01-050)
  const plan = v.visit_plans as unknown as { id: string; method: string; status: string; published_at: string | null; created_at: string; plan_reference: string | null; profiles: { full_name: string } | null } | null;
  // M8 — governed reason label resolution (locale-aware; AR falls back to EN).
  const reasonLabel = (options: ReasonOption[], key: string | null | undefined) => {
    if (!key) return null;
    const opt = options.find(o => o.key === key);
    return opt ? (locale === "ar" ? (opt.label_ar ?? opt.label_en) : opt.label_en) : key;
  };
  const returnReasons = returnReasonsRes.options;
  const cancelReasons = cancelReasonsRes.options;
  // M8 / PLN-CON-011 — return info comes from the LATEST lifecycle 'return'
  // event. LEGACY FALLBACK: historical rows encoded the reason in a
  // 'RETURNED: ' notes prefix; when no event exists the prefix still renders
  // (never break historical rows).
  const latestReturnEvent = lifecycleEvents.find(e => e.event_type === "return") ?? null;
  const legacyReturnReason = v.planning_status === "returned" && typeof v.notes === "string" && v.notes.startsWith("RETURNED: ")
    ? v.notes.slice("RETURNED: ".length) : null;
  const returnReason = latestReturnEvent ? reasonLabel(returnReasons, latestReturnEvent.reason_key) : legacyReturnReason;
  const latestCancelEvent = lifecycleEvents.find(e => e.event_type === "cancel") ?? null;
  const cancelReasonDisplay = reasonLabel(cancelReasons, v.cancellation_reason) ?? v.cancellation_reason;
  // M8 — expiry provenance: the rule that expired this visit + its reason.
  const latestExpireEvent = lifecycleEvents.find(e => e.event_type === "expire") ?? null;
  let expiryRuleReason: string | null = null;
  if (v.expired_by_rule_id) {
    const { data: rule } = await sb.from("planning_expiry_rules").select("rule_type, reason").eq("id", v.expired_by_rule_id).maybeSingle();
    expiryRuleReason = rule?.reason ?? rule?.rule_type ?? null;
  }
  if (!expiryRuleReason && latestExpireEvent) expiryRuleReason = latestExpireEvent.comments ?? latestExpireEvent.reason_key;
  // M8 — bulk context: sibling visits under the same plan.
  let siblingCount = 0;
  if (plan) {
    const { count } = await sb.from("visits").select("id", { count: "exact", head: true }).eq("visit_plan_id", plan.id);
    siblingCount = count ?? 0;
  }
  // M8 — repackage options for returned visits (active packages only).
  let packageOptions: PackageOption[] = [];
  if (v.planning_status === "returned") {
    const today = new Date().toISOString().slice(0, 10);
    const { data: pvs } = await sb.from("package_versions")
      .select("id, version_label, packages(code)").in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`);
    packageOptions = (pvs ?? []).map(p => ({
      id: p.id as string,
      label: `${(p.packages as unknown as { code: string } | null)?.code ?? p.id.slice(0, 8)} · ${p.version_label}`,
    }));
  }
  const pkg = v.package_versions as unknown as { version_label: string; packages: { code: string } } | null;
  const asg = (v.assignments as unknown as { method: string; status: string; profiles: { full_name: string } }[])[0];
  const journeys = v.journey_sessions as unknown as { id: string; started_at: string; geo_events: { kind: string; accuracy_m: number; geofence_result: string | null; gis_version: string; occurred_at: string }[] }[];
  // visits->inspections is to-one (unique visit_id): object or null, NOT an array
  const insp = v.inspections as unknown as { id: string; status: string; submission_versions: { version_number: number; submitted_at: string }[]; reviews: { decision: string | null; status: string; returned_sections: string[] | null }[] } | null;
  // FIX WAVE F4 · M02-042 — attachments (soft-deleted rows excluded); the query
  // failing (e.g. migration 0020 not applied yet) degrades to a verbatim error,
  // never a crash. Signed URLs minted under the caller's session (private bucket).
  const { data: attData, error: attErr } = await sb.from("visit_attachments")
    .select("id, name, mime, storage_path, uploaded_at, uploader:profiles!visit_attachments_uploaded_by_fkey(full_name)")
    .eq("visit_id", id).is("removed_at", null)
    .order("uploaded_at", { ascending: false });
  const attRows: AttachmentRow[] = await Promise.all(((attData ?? []) as unknown as {
    id: string; name: string; mime: string; storage_path: string; uploaded_at: string;
    uploader: { full_name: string } | null;
  }[]).map(async a => {
    const { data: signed, error: sErr } = await sb.storage.from("attachments").createSignedUrl(a.storage_path, 3600);
    return {
      id: a.id, name: a.name, mime: a.mime, uploadedAt: a.uploaded_at,
      uploadedBy: a.uploader?.full_name ?? "—",
      // HANDOFF_BLOCKED_ERRORMAP closure — never leak the raw signed-URL error;
      // the null url already drives the neutral "download link unavailable" state.
      url: signed?.signedUrl ?? null, urlError: sErr ? mapError(sErr, "link") : null,
    };
  }));
  const attachmentsStrings: AttachmentsStrings = {
    heading: t("visit.att.heading", "Attachments (M02-042)"),
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
    heading: t("visit.notes.heading", "Notes (M02-043)"),
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
    reassignTo: t("visit.actions.reassignTo", "Reassign to (M02-009)"),
    reassignReason: t("visit.actions.reassignReason", "Reassignment reason *"),
    reassignBtn: t("visit.actions.reassignBtn", "Reassign"),
    newWindowStart: t("visit.actions.newWindowStart", "New window start (M02-008)"),
    newWindowEnd: t("visit.actions.newWindowEnd", "New window end"),
    rescheduleBtn: t("visit.actions.rescheduleBtn", "Reschedule"),
    cancelReason: t("visit.actions.cancelReason", "Cancellation reason *"),
    cancelComments: t("visit.actions.cancelComments", "Cancellation comments"),
    cancelBtn: t("visit.actions.cancelBtn", "Cancel visit"),
    visitTypeLabel: t("visit.actions.visitTypeLabel", "Visit type (pre-start — M02-006)"),
    visitTypeBtn: t("visit.actions.visitTypeBtn", "Update type"),
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    typeFollowUp: t("enum.follow_up", "Follow-up"),
    typeComplaint: t("enum.complaint", "Complaint"),
    executionStarted: t("visit.actions.executionStarted", "Execution already started ({state}) — cancel and reschedule are locked (M02-006)"),
    finalState: t("visit.actions.finalState", "final state — view only (M02-015/016)"),
    zoneAvailable: t("visit.actions.zoneAvailable", "Available now"),
    zoneBlocked: t("visit.actions.zoneBlocked", "Not available yet — why"),
    zoneUnavailable: t("visit.actions.zoneUnavailable", "Not available in this state"),
    reassignLockedWhy: t("visit.actions.reassignLockedWhy", "reassign locked — inspection already started ({state}) (M02-006)"),
    scheduleLockedWhy: t("visit.actions.scheduleLockedWhy", "locked — execution already started ({state}). Only published, new visits can be rescheduled, changed, or cancelled (M02-006/008)"),
    noneAvailable: t("visit.actions.noneAvailable", "No management actions available in this state."),
    commentsHint: t("visit.actions.commentsHint", "mandatory when the reason is Other"),
    repackageLabel: t("visit.actions.repackageLabel", "New primary checklist (returned — PLN-CON-003)"),
    repackageBtn: t("visit.actions.repackageBtn", "Change checklist"),
    duplicateBtn: t("visit.actions.duplicateBtn", "Duplicate visit"),
    duplicateWhy: t("visit.actions.duplicateWhy", "Duplicate creates a new Draft with planning fields only (PLN-REQ-011)."),
    cutoffTitle: t("visit.actions.cutoffTitle", "Cutoff for cancelling and rescheduling"),
    cutoffBody: t(
      "visit.actions.cutoffBody",
      "The system checks the visit window again when you submit. You can cancel or reschedule until {cutoff} (Asia/Riyadh). Reassignment has no time limit.",
    ),
  };
  // CD-027 — Dual-State Ribbon: five never-collapsed domains, each with the
  // latest VERIFIED event + its source + the allowed-action boundary + a history
  // anchor. Boundaries are derived from the same guards the server actions enforce.
  const fmt = (iso: string) => new Date(iso).toISOString().slice(0, 16).replace("T", " ");
  const preStart = !insp || insp.status === "not_started";
  const canManage = v.planning_status === "published" && v.operational_state === "new";
  // Supervisor-only and pre-start. The server repeats this via the atomic
  // capability, state and overlap checks before it writes anything.
  const canReassign = preStart
    && ["published", "returned"].includes(v.planning_status)
    && !planningAccess.error
    && planningAccess.can("planning.reassign");
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
      sourceLabel: t("visit.ribbon.src.audit", "append-only audit trail (ENG-12)"),
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
      sourceLabel: t("visit.ribbon.src.assign", "assignment record (ENG-05)"),
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
    heading: t("visit.ribbon.heading", "Lifecycle — five state domains (MVP1-FND-002)"),
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
    <Shell current={shellCurrent} title={t("visit.detail.title", "Visit {id} — {factory}").replace("{id}", v.id.slice(0, 8)).replace("{factory}", f.name)}
      context={<>
        {/* M02-002 — full lifecycle: planning status + operational state */}
        <span className={`badge ${PLAN_BADGE[v.planning_status] ?? "badge-pending"}`}>{t(`enum.${v.planning_status}`, v.planning_status)}</span>
        <span className="badge badge-info">{t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " "))}</span>
        {pkg && <span className="badge badge-outline">{pkg.packages.code} · {pkg.version_label}</span>}
        {isUnverifiedManual && <span className="badge badge-warning">{tr("visit.detail.unverifiedManual", "Unverified manual entry — pending reconciliation", "إدخال يدوي غير موثّق — بانتظار المطابقة")}</span>}
      </>}>
      {targetPreview && <div className="page-header" data-saqeel-design="WA-DES-045">
        <div className="stack"><h1>{t("visit.detail.title", "Visit {id} — {factory}").replace("{id}", v.id.slice(0, 8)).replace("{factory}", f.name)}</h1>
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
          <p>{t(`enum.${v.visit_type}`, v.visit_type)} · {t(`enum.${v.execution_mode}`, v.execution_mode)} · {t("visit.detail.window", "window")} <span className="id-code">{new Date(v.window_start).toISOString().slice(0, 16).replace("T", " ")} → {new Date(v.window_end).toISOString().slice(5, 16).replace("T", " ")}</span></p>
          <p>{t("visit.detail.assignment", "Assignment:")} <strong>{asg?.profiles?.full_name ?? "—"}</strong> ({asg ? t(`enum.${asg.method}`, asg.method) : "—"}) · <a className="btn btn-ghost btn-sm" href={`/factories/${f.id}`}>{t("visit.detail.factory360", "Factory 360")}</a></p>

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
                <p key={s.version_number} className="id-code"><span className="badge badge-outline">v{s.version_number}</span> {new Date(s.submitted_at).toISOString().slice(0, 16).replace("T", " ")} · {t("visit.detail.immutable", "final")}</p>
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
        <div className="panel-header"><h2 className="panel-title">{t("visit.detail.planHeading", "Linked plan (M02-005)")}</h2></div>
        <div className="panel-body">
        {plan ? (
          <p>
            <span className="badge badge-info">{t(`enum.${plan.method}`, plan.method)}</span>{" "}
            <span className="id-code"><strong>{plan.plan_reference ?? plan.id.slice(0, 8)}</strong></span> · {t("visit.detail.planCreatedBy", "created by")} <strong>{plan.profiles?.full_name ?? "—"}</strong>{" "}
            <span className="id-code">{new Date(plan.created_at).toISOString().slice(0, 16).replace("T", " ")}</span>
            {plan.published_at && <> · {t("visit.detail.planPublishedAt", "published")} <span className="id-code">{new Date(plan.published_at).toISOString().slice(0, 16).replace("T", " ")}</span></>}
            {" "}· <span className={`badge ${PLAN_BADGE[plan.status] ?? "badge-pending"}`}>{t(`enum.${plan.status}`, plan.status)}</span>
            {/* M8 — bulk context: this visit is one of N under the plan */}
            {" "}· {t("visit.detail.siblings", "{n} visits under this plan").replace("{n}", String(siblingCount))}
            {" "}· <a className="btn btn-ghost btn-sm" href={`/planning/plans/${plan.id}`}>{t("visit.detail.openPlan", "Open plan")}</a>
          </p>
        ) : (
          <p className="t-caption">{t("visit.detail.noPlan", "Urgent visit — created without a plan (M01-050).")}</p>
        )}
        </div>
      </section>
      {/* M02-008/029 + M8 — return info from the lifecycle stream; the legacy
          notes-prefix parse only fires for historical rows without an event.
          M10 / PLN-REQ-009 — notification deep-links (?focus=return) anchor
          and highlight this block. */}
      {returnReason && (
        <div id="return-block" className="alert alert-warning" tabIndex={focus === "return" ? -1 : undefined}>
          {t("visit.detail.returnReason", "Returned — reason: {reason} (PLN-CON-011)").replace("{reason}", returnReason)}
          {latestReturnEvent?.comments ? <> · <bdi>{latestReturnEvent.comments}</bdi></> : null}
          {latestReturnEvent ? <span className="t-caption"> · {new Date(latestReturnEvent.created_at).toISOString().slice(0, 16).replace("T", " ")}</span> : null}
        </div>
      )}
      {focus === "return" && returnReason ? <FocusScroll targetId="return-block" /> : null}
      {v.planning_status === "cancelled" && cancelReasonDisplay && (
        <div className="alert alert-critical">
          {t("visit.detail.cancelledReason", "Cancelled — reason: {reason} (M02-006, final)").replace("{reason}", cancelReasonDisplay)}
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
        <div className="alert alert-critical" role="alert">{mapError(attErr, "load")}</div>
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
          <p className="t-caption">{t("visit.detail.noPackages", "No checklist selected — the inspector chooses an eligible checklist during preparation (PLN-CON-003).")}</p>
        ) : (
          <ul className="timeline">
            {pkgLinks.map(l => (
              <li key={l.id}>
                <span className={l.package_version_id === v.package_version_id ? "tl-dot is-accent" : "tl-dot"} />
                <div>
                  <strong>{l.snapshot?.code ?? l.package_version_id.slice(0, 8)}</strong>
                  {l.snapshot?.title ? <> · {l.snapshot.title}</> : null}
                  {l.snapshot?.version_label ? <> · <span className="badge badge-outline">{l.snapshot.version_label}</span></> : null}
                  {l.package_version_id === v.package_version_id && <span className="badge badge-info">{t("visit.detail.primaryPackage", "primary")}</span>}
                  <br />
                  <span className="tl-meta id-code">
                    {t("visit.detail.packageLinkedAt", "linked")} {new Date(l.added_at).toISOString().slice(0, 16).replace("T", " ")}
                    {l.snapshot?.status ? <> · {t("visit.detail.packageSnapshot", "snapshot at link time:")} {l.snapshot.status}</> : null}
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
        <div className="panel-header"><h2 className="panel-title">{t("visit.detail.lifecycleHeading", "Lifecycle history — append-only (PLN-CON-011)")}</h2></div>
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
                      {new Date(e.created_at).toISOString().slice(0, 19).replace("T", " ")} · {e.actor ? t("visit.detail.auditActor", "by {who}").replace("{who}", e.actor.slice(0, 8)) : t("visit.detail.auditSystem", "system")}
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
                    {new Date(e.created_at).toISOString().slice(0, 19).replace("T", " ")} · {e.actor ? t("visit.detail.auditActor", "by {who}").replace("{who}", e.actor.slice(0, 8)) : t("visit.detail.auditSystem", "system")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        </div>
      </section>
      <section id="journey" className="panel">
        <div className="panel-header"><h2 className="panel-title">{t("visit.detail.journeyHeading", "Journey & location events — cannot be edited (EV-005)")}</h2></div>
        <div className="panel-body">
        <ul className="timeline">
          {journeys.flatMap(j => j.geo_events.map(g => (
            <li key={g.occurred_at}>
              <span className={g.kind === "checkin" ? "tl-dot is-accent" : "tl-dot"} />
              <div><strong>{t(`enum.${g.kind}`, g.kind)}</strong> · ±{g.accuracy_m} m {g.geofence_result && <span className="badge badge-compliant">{t(`enum.${g.geofence_result}`, g.geofence_result)}</span>}<br />
                <span className="tl-meta id-code">{new Date(g.occurred_at).toISOString().slice(0, 19).replace("T", " ")} · gis {g.gis_version}</span></div>
            </li>
          )))}
          {journeys.length === 0 && <p className="t-caption">{t("visit.detail.noJourney", "No journey yet.")}</p>}
        </ul>
        </div>
      </section>
      <section id="audit" className="panel">
        <div className="panel-header"><h2 className="panel-title">{t("visit.detail.auditHeading", "Planning history — cannot be edited, only added to (ENG-12, latest 30)")}</h2></div>
        <div className="panel-body">
        <ul className="timeline">
          {(auditRows ?? []).map(a => (
            <li key={a.id}>
              <span className="tl-dot" />
              <div><strong>{t(`enum.audit.${a.action}`, a.action)}</strong> · {a.actor ? t("visit.detail.auditActor", "by {who}").replace("{who}", a.actor.slice(0, 8)) : t("visit.detail.auditSystem", "system")}<br />
                <span className="tl-meta id-code">{new Date(a.occurred_at).toISOString().slice(0, 19).replace("T", " ")}</span></div>
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
