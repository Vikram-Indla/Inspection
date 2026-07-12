import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import ActionBar, { type ActionBarStrings } from "./ActionBar";
import Attachments, { type AttachmentRow, type AttachmentsStrings } from "./Attachments";
import NotesEditor, { type NotesStrings } from "./NotesEditor";

export const dynamic = "force-dynamic";

const PLAN_TONE: Record<string, string> = { published: "ax-lozenge--info", returned: "ax-lozenge--warning", cancelled: "ax-lozenge--critical" };

export default async function VisitDetail({ params }: { params: Promise<{ id: string }> }) {
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
    return <Shell current="/visits" title={t("visit.detail.errorTitle", "Visit — error")}><div className="ax-banner ax-banner--critical"><div>{t("visit.detail.loadError", "Could not load visit:")} {vErr.message}</div></div></Shell>;
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
      url: signed?.signedUrl ?? null, urlError: sErr?.message ?? null,
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
  };
  return (
    <Shell current="/visits" title={t("visit.detail.title", "Visit {id} — {factory}").replace("{id}", v.id.slice(0, 8)).replace("{factory}", f.name)}
      context={<>
        {/* M02-002 — full lifecycle: planning status + operational state */}
        <span className={`ax-lozenge ax-lozenge--plan ${PLAN_TONE[v.planning_status] ?? ""}`}>{t(`enum.${v.planning_status}`, v.planning_status)}</span>
        <span className="ax-lozenge ax-lozenge--ops">{t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " "))}</span>
        {pkg && <span className="ax-version">{pkg.packages.code} · {pkg.version_label}</span>}
      </>}>
      <div className="ax-grid-2">
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("visit.detail.configuration", "Configuration")}</h4>
          <p>{t(`enum.${v.visit_type}`, v.visit_type)} · {t(`enum.${v.execution_mode}`, v.execution_mode)} · {t("visit.detail.window", "window")} <span className="ax-numeric">{new Date(v.window_start).toISOString().slice(0, 16).replace("T", " ")} → {new Date(v.window_end).toISOString().slice(5, 16).replace("T", " ")}</span></p>
          <p style={{ marginBlockStart: 8 }}>{t("visit.detail.assignment", "Assignment:")} <strong>{asg?.profiles?.full_name ?? "—"}</strong> ({asg ? t(`enum.${asg.method}`, asg.method) : "—"}) · <a className="ax-link" href={`/factories/${f.id}`}>{t("visit.detail.factory360", "Factory 360 →")}</a></p>
        </div>
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
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
        visitType={v.visit_type} windowStart={v.window_start} windowEnd={v.window_end} inspectors={inspectors} strings={actionStrings} />
      {/* FIX WAVE F4 — M02-043 notes add/edit */}
      <NotesEditor visitId={v.id} initialNotes={typeof v.notes === "string" ? v.notes : ""} strings={notesStrings} />
      {/* FIX WAVE F4 — M02-042 attachments */}
      {attErr ? (
        <div className="ax-banner ax-banner--critical"><div>{t("visit.att.loadError", "Could not load attachments (M02-042):")} {attErr.message}</div></div>
      ) : (
        <Attachments visitId={v.id} rows={attRows} strings={attachmentsStrings} />
      )}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
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
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("visit.detail.auditHeading", "Planning history — immutable, append-only (ENG-12)")}</h4>
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
