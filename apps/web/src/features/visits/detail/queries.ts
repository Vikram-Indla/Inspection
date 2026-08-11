import { readRows, readSingle } from "@/lib/postgrest/read";
import { supabaseServer } from "@/lib/supabase-server";
import { getPlanningAccess } from "@/lib/planning/access";
import { getReasonOptions, type ReasonOption } from "@/lib/planning/lifecycle";
import { riyadhToday } from "@/lib/dates";
import {
  attachmentSourceRow, auditRow, lifecycleRow, locationRow, packageLinkRow, visitDetailRow,
} from "./shapes";
import type {
  AttachmentSourceRow, AuditRow, LifecycleRow, LocationRow, PackageLinkRow, VisitRow,
} from "./types";

const VISIT_COLUMNS = `id, visit_type, execution_mode, planning_status, planning_version, operational_state, window_start, window_end, cancellation_reason, notes,
      immediate_creator_role, source_channel, internal_reference, priority, visit_reference, expired_by_rule_id, package_version_id,
      planner_lat, planner_lng, original_lat, original_lng, visit_location_source, created_at,
      visit_plans(id, method, status, published_at, created_at, plan_reference, profiles!visit_plans_created_by_fkey(full_name)),
      factories(id, factory_code, name, cr_number, official_lat, official_lng, risk_band, is_temporary, source),
      package_versions(version_label, packages(code)),
      assignments(method, status, profiles(full_name)),
      journey_sessions(id, started_at, geo_events(kind, accuracy_m, geofence_result, gis_version, occurred_at)),
      inspections(id, status, submission_versions(version_number, submitted_at), reviews(decision, status, returned_sections))`;

export type PackageOptionRow = { id: string; label: string };

export type VisitDetailData = {
  visit: VisitRow;
  audit: AuditRow[];
  lifecycle: LifecycleRow[];
  location: LocationRow[];
  packageLinks: PackageLinkRow[];
  attachments: AttachmentSourceRow[];
  attachmentsFailed: boolean;
  signedUrls: Map<string, string>;
  inspectors: { user_id: string; full_name: string }[];
  returnReasons: ReasonOption[];
  cancelReasons: ReasonOption[];
  packageOptions: PackageOptionRow[];
  expiryRuleReason: string | null;
  siblingCount: number;
  canReassignByRole: boolean;
};

export type VisitDetailResult =
  | { kind: "error" }
  | { kind: "not-found" }
  | { kind: "ready"; data: VisitDetailData };

export async function loadVisitDetail(id: string): Promise<VisitDetailResult> {
  const sb = await supabaseServer();
  const planningAccess = await getPlanningAccess(sb, ["planning.reassign"]);
  const rosterRpc = await sb.rpc("list_available_reassignment_inspectors", { p_visit_ids: [id] });
  if (rosterRpc.error) console.error(`[visit.detail] reassignment roster: ${rosterRpc.error.message}`);
  const roster = readRows(
    { data: rosterRpc.data ?? [], error: null },
    f => ({ inspector_id: f.text("inspector_id"), full_name: f.text("full_name") }),
    "visits.detail.roster",
  );

  const visitRead = readSingle(
    await sb.from("visits").select(VISIT_COLUMNS).eq("id", id).maybeSingle(),
    visitDetailRow,
    "visits.detail.visit",
  );
  if (visitRead.failed) return { kind: "error" };
  if (!visitRead.row) return { kind: "not-found" };
  const visit = visitRead.row;

  const [auditRead, lifecycleRead, locationRead, packageRead, attachmentRead, returnReasons, cancelReasons] =
    await Promise.all([
      sb.from("audit_events").select("id, actor, action, before_state, after_state, occurred_at")
        .eq("object_type", "visits").eq("object_id", id)
        .order("occurred_at", { ascending: false }).limit(30)
        .then(response => readRows(response, auditRow, "visits.detail.audit")),
      sb.from("visit_lifecycle_events").select("id, event_type, reason_key, comments, actor, previous, created_at")
        .eq("visit_id", id).order("created_at", { ascending: false }).limit(50)
        .then(response => readRows(response, lifecycleRow, "visits.detail.lifecycle")),
      sb.from("visit_location_events").select("id, lat, lng, source, actor, note, created_at")
        .eq("visit_id", id).order("created_at", { ascending: false }).limit(50)
        .then(response => readRows(response, locationRow, "visits.detail.location")),
      sb.from("visit_packages").select("id, package_version_id, snapshot, added_at")
        .eq("visit_id", id).order("added_at", { ascending: true })
        .then(response => readRows(response, packageLinkRow, "visits.detail.packages")),
      sb.from("visit_attachments")
        .select("id, name, mime, storage_path, uploaded_at, uploader:profiles!visit_attachments_uploaded_by_fkey(full_name)")
        .eq("visit_id", id).is("removed_at", null).order("uploaded_at", { ascending: false })
        .then(response => readRows(response, attachmentSourceRow, "visits.detail.attachments")),
      getReasonOptions(sb, "return_reason"),
      getReasonOptions(sb, "cancellation_reason"),
    ]);

  const signedUrls = new Map<string, string>();
  await Promise.all(attachmentRead.rows.map(async row => {
    const { data: signed } = await sb.storage.from("attachments").createSignedUrl(row.storage_path, 3600);
    if (signed?.signedUrl) signedUrls.set(row.id, signed.signedUrl);
  }));

  const packageOptions = visit.planning_status === "returned"
    ? await loadPackageOptions(sb)
    : [];

  const expiryRuleReason = await resolveExpiryReason(sb, visit, lifecycleRead.rows);

  const siblingCount = visit.visit_plans
    ? (await sb.from("visits").select("id", { count: "exact", head: true })
      .eq("visit_plan_id", visit.visit_plans.id)).count ?? 0
    : 0;

  return {
    kind: "ready",
    data: {
      visit,
      audit: auditRead.rows,
      lifecycle: lifecycleRead.rows,
      location: locationRead.rows,
      packageLinks: packageRead.rows,
      attachments: attachmentRead.rows,
      attachmentsFailed: attachmentRead.failed,
      signedUrls,
      inspectors: roster.rows.map(row => ({ user_id: row.inspector_id, full_name: row.full_name })),
      returnReasons: returnReasons.options,
      cancelReasons: cancelReasons.options,
      packageOptions,
      expiryRuleReason,
      siblingCount,
      canReassignByRole: !planningAccess.error && planningAccess.can("planning.reassign"),
    },
  };
}

type DetailClient = Awaited<ReturnType<typeof supabaseServer>>;

async function loadPackageOptions(sb: DetailClient): Promise<PackageOptionRow[]> {
  const today = riyadhToday();
  const read = readRows(
    await sb.from("package_versions").select("id, version_label, packages(code)")
      .in("status", ["published", "locked"])
      .lte("effective_from", today)
      .or(`effective_to.is.null,effective_to.gte.${today}`),
    f => ({
      id: f.text("id"),
      version_label: f.text("version_label"),
      packages: f.toOne("packages", pkg => ({ code: pkg.text("code") })),
    }),
    "visits.detail.package_versions",
  );
  return read.rows.map(row => ({
    id: row.id,
    label: `${row.packages?.code ?? row.id.slice(0, 8)} · ${row.version_label}`,
  }));
}

async function resolveExpiryReason(
  sb: DetailClient,
  visit: VisitRow,
  lifecycle: LifecycleRow[],
): Promise<string | null> {
  if (visit.expired_by_rule_id) {
    const { data: rule } = await sb.from("planning_expiry_rules")
      .select("rule_type, reason").eq("id", visit.expired_by_rule_id).maybeSingle();
    const resolved = rule?.reason ?? rule?.rule_type ?? null;
    if (resolved) return resolved;
  }
  const expireEvent = lifecycle.find(event => event.event_type === "expire");
  return expireEvent?.comments ?? expireEvent?.reason_key ?? null;
}
