import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import ActionBar, { type ActionBarStrings } from "./ActionBar";
import Attachments, { type AttachmentRow, type AttachmentsStrings } from "./Attachments";
import NotesEditor, { type NotesStrings } from "./NotesEditor";
import DualStateRibbon, { type RibbonTrack, type RibbonStrings } from "./DualStateRibbon";
import { mapError } from "./neutral";
import CreatedToast from "@/components/CreatedToast";

export const dynamic = "force-dynamic";

const PLAN_TONE: Record<string, string> = { published: "ax-lozenge--info", returned: "ax-lozenge--warning", cancelled: "ax-lozenge--critical" };

export default async function VisitDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { created } = await searchParams;
  const { id } = await params;
  const { t } = await useT();
  const sb = await supabaseServer();
  // ENG-05 — inspector pool; user_roles embed on profiles is ambiguous, disambiguate via !user_roles_user_id_fkey
  const { data: inspRows } = await sb.from("profiles")
    .select("user_id, full_name, user_roles!user_roles_user_id_fkey!inner(role_key)")
    .eq("user_roles.role_key", "inspector").order("full_name");
  const inspectors = (inspRows ?? []).map(r => ({ user_id: r.user_id as string, full_name: r.full_name as string }));
  const { data: v, error: vErr } = await sb.from("visits")
    .select(`id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, cancellation_reason, notes,
      visit_plans(id, method, status, published_at, created_at, profiles(full_name)),
      factories(id, factory_code, name, cr_number, official_lat, official_lng, risk_band),
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
  if (vErr) {
    return <Shell current="/visits" title={t("visit.detail.errorTitle", "Visit — error")}><div className="ax-banner ax-banner--critical" role="alert"><div>{mapError(vErr, "load")}</div></div></Shell>;
  }
  if (!v) {
    return <Shell current="/visits" title={t("visit.detail.notFoundTitle", "Visit not found")}><div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">∅</span><h4>{t("visit.detail.notFound", "Not in your scope or does not exist")}</h4><p className="ax-caption">{t("visit.detail.notFoundDesc", "IDs are immutable, never reused (FLD-VIS-001).")}</p></div></div></Shell>;
  }
  const f = v.factories as unknown as { id: string; factory_code: string; name: string; cr_number: string; risk_band: string };
  // visits->visit_plans is TO-ONE (FK on visits): object or null (null = immediate, M01-050)
  const plan = v.visit_plans as unknown as { id: string; method: string; status: string; published_at: string | null; created_at: string; profiles: { full_name: string } | null } | null;
  const returnReason = v.planning_status === "returned" && typeof v.notes === "string" && v.notes.startsWith("RETURNED: ")
    ? v.notes.slice("RETURNED: ".length) : null;
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
    fileLabel: t("visit.att.fileLabel", "Attach a file (planner/ops — RLS-enforced)"),
    uploadBtn: t("visit.att.uploadBtn", "Upload"),
    uploading: t("visit.att.uploading", "Uploading…"),
    urlFailed: t("visit.att.urlFailed", "download link unavailable"),
  };
  const notesStrings: NotesStrings = {
    heading: t("visit.notes.heading", "Notes (M02-043)"),
    label: t("visit.notes.label", "Visit notes"),
    placeholder: t("visit.notes.placeholder", "Context for the inspector or operations — saved to the visit, audited"),
    saveBtn: t("visit.notes.saveBtn", "Save notes"),
    saving: t("visit.notes.saving", "Saving…"),
    hint: t("visit.notes.hint", "planner/ops only (RLS visits_update) · return flows also write here (M02-008)"),
  };
  const actionStrings: ActionBarStrings = {
    heading: t("visit.actions.heading", "Management actions — state-guarded (only valid transitions succeed)"),
    returnReason: t("visit.actions.returnReason", "Return reason *"),
    returnPlaceholder: t("visit.actions.returnPlaceholder", "mandatory — STM-VIS-001"),
    returnBtn: t("visit.actions.returnBtn", "Return"),
    republishBtn: t("visit.actions.republishBtn", "Republish (same ID)"),
    reassignTo: t("visit.actions.reassignTo", "Reassign to (M02-009)"),
    reassignBtn: t("visit.actions.reassignBtn", "Reassign"),
    newWindowStart: t("visit.actions.newWindowStart", "New window start (M02-008)"),
    newWindowEnd: t("visit.actions.newWindowEnd", "New window end"),
    rescheduleBtn: t("visit.actions.rescheduleBtn", "Reschedule"),
    cancelReason: t("visit.actions.cancelReason", "Cancellation reason *"),
    cancelPlaceholder: t("visit.actions.cancelPlaceholder", "final — M02-006"),
    cancelBtn: t("visit.actions.cancelBtn", "Cancel visit"),
    visitTypeLabel: t("visit.actions.visitTypeLabel", "Visit type (pre-start — M02-006)"),
    visitTypeBtn: t("visit.actions.visitTypeBtn", "Update type"),
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    typeFollowUp: t("enum.follow_up", "Follow-up"),
    typeComplaint: t("enum.complaint", "Complaint"),
    executionStarted: t("visit.actions.executionStarted", "execution started ({state}) — cancel / reschedule locked (M02-006)"),
    finalState: t("visit.actions.finalState", "final state — view only (M02-015/016)"),
    zoneAvailable: t("visit.actions.zoneAvailable", "Available now"),
    zoneBlocked: t("visit.actions.zoneBlocked", "Not available yet — why"),
    zoneUnavailable: t("visit.actions.zoneUnavailable", "Unavailable in this state"),
    reassignLockedWhy: t("visit.actions.reassignLockedWhy", "reassign locked — inspection already started ({state}) (M02-006)"),
    scheduleLockedWhy: t("visit.actions.scheduleLockedWhy", "locked — execution started ({state}); only published/new visits can be rescheduled, retyped or cancelled (M02-006/008)"),
    noneAvailable: t("visit.actions.noneAvailable", "No management actions available in this state."),
  };
  // CD-027 — Dual-State Ribbon: five never-collapsed domains, each with the
  // latest VERIFIED event + its source + the allowed-action boundary + a history
  // anchor. Boundaries are derived from the same guards the server actions enforce.
  const fmt = (iso: string) => new Date(iso).toISOString().slice(0, 16).replace("T", " ");
  const preStart = !insp || insp.status === "not_started";
  const canManage = v.planning_status === "published" && v.operational_state === "new";
  const canReassign = ["published", "returned"].includes(v.planning_status) && preStart;
  const isFinal = ["cancelled", "expired"].includes(v.planning_status);
  const latestAudit = (auditRows ?? [])[0];
  const geoEvents = journeys.flatMap(j => j.geo_events).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  const latestGeo = geoEvents[0];
  const latestSub = insp ? [...insp.submission_versions].sort((a, b) => b.version_number - a.version_number)[0] : undefined;
  const reviews = insp?.reviews ?? [];
  const latestReview = reviews[reviews.length - 1];
  const noEvt = t("visit.ribbon.noEvent", "no verified event yet");
  const planningBoundary = canManage
    ? t("visit.ribbon.b.manage", "Return · reassign · reschedule · change type · cancel")
    : v.planning_status === "returned" ? t("visit.ribbon.b.returned", "Republish · reassign")
    : v.planning_status === "published" ? t("visit.ribbon.b.locked", "Return · reassign only — execution started, schedule/type/cancel locked")
    : t("visit.ribbon.b.none", "None — final state, view only");
  const ribbonTracks: RibbonTrack[] = [
    { id: "planning", domainLabel: t("visit.ribbon.planning", "Planning"),
      stateLabel: t(`enum.${v.planning_status}`, v.planning_status), tone: PLAN_TONE[v.planning_status] ?? "",
      eventLabel: latestAudit ? `${t(`enum.audit.${latestAudit.action}`, latestAudit.action)} · ${fmt(latestAudit.occurred_at)}` : noEvt,
      sourceLabel: t("visit.ribbon.src.audit", "append-only audit trail (ENG-12)"),
      boundaryLabel: planningBoundary, anchorHref: "#audit", anchorLabel: t("visit.ribbon.a.audit", "Open planning history") },
    { id: "operational", domainLabel: t("visit.ribbon.operational", "Operational"),
      stateLabel: t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " ")), tone: "",
      eventLabel: latestGeo ? `${t(`enum.${latestGeo.kind}`, latestGeo.kind)} · ${fmt(latestGeo.occurred_at)}` : t("visit.ribbon.noJourney", "no journey yet"),
      sourceLabel: t("visit.ribbon.src.field", "field app / journey engine"),
      boundaryLabel: t("visit.ribbon.b.opRead", "Read-only here — owned by the field app (set_operational_state)"),
      anchorHref: "#journey", anchorLabel: t("visit.ribbon.a.journey", "Open journey & location") },
    { id: "assignment", domainLabel: t("visit.ribbon.assignment", "Assignment"),
      stateLabel: asg ? t(`enum.${asg.status}`, asg.status) : t("visit.ribbon.unassigned", "unassigned"), tone: asg ? "ax-lozenge--info" : "",
      eventLabel: asg ? `${t(`enum.${asg.method}`, asg.method)} · ${asg.profiles?.full_name ?? "—"}` : t("visit.ribbon.noInspector", "no inspector assigned"),
      sourceLabel: t("visit.ribbon.src.assign", "assignment record (ENG-05)"),
      boundaryLabel: canReassign ? t("visit.ribbon.b.reassign", "Reassign inspector (pre-start only)") : t("visit.ribbon.b.reassignLocked", "Read-only — reassignment locked"),
      anchorHref: "#config", anchorLabel: t("visit.ribbon.a.config", "Open assignment") },
    { id: "inspection", domainLabel: t("visit.ribbon.inspection", "Inspection"),
      stateLabel: insp ? t(`enum.${insp.status}`, insp.status.replace(/_/g, " ")) : t("enum.not_started", "not started"), tone: insp ? "ax-lozenge--info" : "",
      eventLabel: latestSub ? `v${latestSub.version_number} · ${fmt(latestSub.submitted_at)} · ${t("visit.detail.immutable", "immutable")}` : t("visit.ribbon.noSub", "not submitted"),
      sourceLabel: t("visit.ribbon.src.insp", "inspection engine — submissions immutable"),
      boundaryLabel: t("visit.ribbon.b.read", "Read-only here"), anchorHref: "#inspection", anchorLabel: t("visit.ribbon.a.insp", "Open inspection & versions") },
    { id: "review", domainLabel: t("visit.ribbon.review", "Review"),
      stateLabel: latestReview ? t(`enum.${latestReview.decision ?? latestReview.status}`, (latestReview.decision ?? latestReview.status).replace(/_/g, " ")) : t("visit.ribbon.noReview", "no review"),
      tone: latestReview?.decision === "approved" ? "ax-lozenge--success" : latestReview?.decision === "rejected" ? "ax-lozenge--critical" : latestReview ? "ax-lozenge--warning" : "",
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
  return (
    <Shell current="/visits" title={t("visit.detail.title", "Visit {id} — {factory}").replace("{id}", v.id.slice(0, 8)).replace("{factory}", f.name)}
      context={<>
        {/* M02-002 — full lifecycle: planning status + operational state */}
        <span className={`ax-lozenge ax-lozenge--plan ${PLAN_TONE[v.planning_status] ?? ""}`}>{t(`enum.${v.planning_status}`, v.planning_status)}</span>
        <span className="ax-lozenge ax-lozenge--ops">{t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " "))}</span>
        {pkg && <span className="ax-version">{pkg.packages.code} · {pkg.version_label}</span>}
      </>}>
      <CreatedToast created={created}
        registeredMessage={t("visit.detail.createdToast", "Visit created and dispatched.")}
        unregisteredMessage={t("visit.detail.createdToastUnregistered", "Unregistered establishment recorded and visit dispatched.")} />
      {/* CD-027 — signature interaction: Dual-State Ribbon (one per screen) */}
      <DualStateRibbon tracks={ribbonTracks} strings={ribbonStrings} />
      <div className="ax-grid-2">
        <div id="config" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("visit.detail.configuration", "Configuration")}</h4>
          <p>{t(`enum.${v.visit_type}`, v.visit_type)} · {t(`enum.${v.execution_mode}`, v.execution_mode)} · {t("visit.detail.window", "window")} <span className="ax-numeric">{new Date(v.window_start).toISOString().slice(0, 16).replace("T", " ")} → {new Date(v.window_end).toISOString().slice(5, 16).replace("T", " ")}</span></p>
          <p style={{ marginBlockStart: 8 }}>{t("visit.detail.assignment", "Assignment:")} <strong>{asg?.profiles?.full_name ?? "—"}</strong> ({asg ? t(`enum.${asg.method}`, asg.method) : "—"}) · <a className="ax-link" href={`/factories/${f.id}`}>{t("visit.detail.factory360", "Factory 360 →")}</a></p>
        </div>
        <div id="inspection" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("visit.detail.inspectionVersions", "Inspection & versions")}</h4>
          {insp ? (
            <div className="ax-stack" style={{ gap: 8 }}>
              <span className="ax-lozenge ax-lozenge--review ax-lozenge--info">{t(`enum.${insp.status}`, insp.status.replace(/_/g, " "))}</span>
              {insp.submission_versions.sort((a, b) => a.version_number - b.version_number).map(s => (
                <p key={s.version_number} className="ax-numeric"><span className="ax-version">v{s.version_number}</span> {new Date(s.submitted_at).toISOString().slice(0, 16).replace("T", " ")} · {t("visit.detail.immutable", "immutable")}</p>
              ))}
              {insp.reviews.map((r, i) => (
                <p key={i} className="ax-caption">{t("visit.detail.reviewPrefix", "review:")} {r.decision ? t(`enum.${r.decision}`, r.decision) : t(`enum.${r.status}`, r.status.replace(/_/g, " "))}{r.returned_sections ? ` · ${t("visit.detail.returnedSections", "returned")} ${r.returned_sections.join(",")}` : ""}</p>
              ))}
              {/* M04-215 — official report (browser print-to-PDF is the production PDF path) */}
              <p><a className="ax-link" href={`/reports/inspection/${insp.id}`}>{t("visit.detail.reportLink", "Official inspection report →")}</a></p>
            </div>
          ) : <p className="ax-caption">{t("visit.detail.notStarted", "Not started.")}</p>}
        </div>
      </div>
      {/* M02-005 — linked plan info: how this visit was planned, by whom, published when */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("visit.detail.planHeading", "Linked plan (M02-005)")}</h4>
        {plan ? (
          <p>
            <span className="ax-lozenge ax-lozenge--info">{t(`enum.${plan.method}`, plan.method)}</span>{" "}
            <span className="ax-numeric">{plan.id.slice(0, 8)}</span> · {t("visit.detail.planCreatedBy", "created by")} <strong>{plan.profiles?.full_name ?? "—"}</strong>{" "}
            <span className="ax-numeric">{new Date(plan.created_at).toISOString().slice(0, 16).replace("T", " ")}</span>
            {plan.published_at && <> · {t("visit.detail.planPublishedAt", "published")} <span className="ax-numeric">{new Date(plan.published_at).toISOString().slice(0, 16).replace("T", " ")}</span></>}
            {" "}· <span className={`ax-lozenge ax-lozenge--plan ${PLAN_TONE[plan.status] ?? ""}`}>{t(`enum.${plan.status}`, plan.status)}</span>
          </p>
        ) : (
          <p className="ax-caption">{t("visit.detail.noPlan", "Immediate visit — created without a plan (M01-050).")}</p>
        )}
      </div>
      {/* M02-008/029 — return reason surfaced, not just stored */}
      {returnReason && (
        <div className="ax-banner ax-banner--warning"><div>{t("visit.detail.returnReason", "Returned — reason: {reason} (M02-008)").replace("{reason}", returnReason)}</div></div>
      )}
      {v.planning_status === "cancelled" && v.cancellation_reason && (
        <div className="ax-banner ax-banner--critical"><div>{t("visit.detail.cancelledReason", "Cancelled — reason: {reason} (M02-006, final)").replace("{reason}", v.cancellation_reason)}</div></div>
      )}
      <ActionBar visitId={v.id} status={v.planning_status} opState={v.operational_state}
        opStateLabel={t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " "))}
        visitType={v.visit_type} windowStart={v.window_start} windowEnd={v.window_end} inspectors={inspectors}
        canManage={canManage} canReassign={canReassign} isFinal={isFinal} strings={actionStrings} />
      {/* FIX WAVE F4 — M02-043 notes add/edit */}
      <NotesEditor visitId={v.id} initialNotes={typeof v.notes === "string" ? v.notes : ""} strings={notesStrings} />
      {/* FIX WAVE F4 — M02-042 attachments */}
      {attErr ? (
        <div className="ax-banner ax-banner--critical" role="alert"><div>{mapError(attErr, "load")}</div></div>
      ) : (
        <Attachments visitId={v.id} rows={attRows} strings={attachmentsStrings} />
      )}
      <div id="journey" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("visit.detail.journeyHeading", "Journey & location events — immutable (EV-005)")}</h4>
        <ul className="ax-timeline">
          {journeys.flatMap(j => j.geo_events.map(g => (
            <li key={g.occurred_at} className={g.kind === "checkin" ? "is-key" : undefined}>
              <div><strong>{t(`enum.${g.kind}`, g.kind)}</strong> · ±{g.accuracy_m} m {g.geofence_result && <span className="ax-lozenge ax-lozenge--success">{t(`enum.${g.geofence_result}`, g.geofence_result)}</span>}<br />
                <span className="ax-timeline__meta ax-numeric">{new Date(g.occurred_at).toISOString().slice(0, 19).replace("T", " ")} · gis {g.gis_version}</span></div>
            </li>
          )))}
          {journeys.length === 0 && <p className="ax-caption">{t("visit.detail.noJourney", "No journey yet.")}</p>}
        </ul>
      </div>
      <div id="audit" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("visit.detail.auditHeading", "Planning history — immutable, append-only (ENG-12, latest 30)")}</h4>
        <ul className="ax-timeline">
          {(auditRows ?? []).map(a => (
            <li key={a.id}>
              <div><strong>{t(`enum.audit.${a.action}`, a.action)}</strong> · {a.actor ? t("visit.detail.auditActor", "by {who}").replace("{who}", a.actor.slice(0, 8)) : t("visit.detail.auditSystem", "system")}<br />
                <span className="ax-timeline__meta ax-numeric">{new Date(a.occurred_at).toISOString().slice(0, 19).replace("T", " ")}</span></div>
            </li>
          ))}
          {(auditRows ?? []).length === 0 && <p className="ax-caption">{t("visit.detail.noAudit", "No audited changes yet, or you don't have audit-read access.")}</p>}
        </ul>
      </div>
    </Shell>
  );
}
