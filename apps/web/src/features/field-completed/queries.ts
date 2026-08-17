import {
  latestSubmittedVersions,
  normalizeEmbedded,
  type CompletedHistoryRecord,
  type SubmittedSnapshot,
} from "@/lib/field/completed-history";
import { logProviderError } from "@/lib/neutral-error";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

const VERSION_COLUMNS = "id, version_number, snapshot, acknowledgement, submitted_at, submitted_by";
const LIST_SELECT = `visits(id, visit_type, factories(name, factory_code), inspections(id, status, submission_versions(${VERSION_COLUMNS})))`;
const DETAIL_SELECT = `visits(id, visit_type, factories(name, factory_code), inspections!inner(id, status, submission_versions!inner(${VERSION_COLUMNS})))`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function unwrap(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

type VersionShape = {
  id: string;
  version_number: number;
  snapshot: SubmittedSnapshot;
  acknowledgement: CompletedHistoryRecord["acknowledgement"];
  submitted_at: string;
  submitted_by: string;
};

function toRecords(visitValue: unknown): CompletedHistoryRecord[] {
  const visit = unwrap(visitValue);
  if (!isRecord(visit)) return [];
  const factory = unwrap(visit.factories);
  const factoryName = isRecord(factory) ? asString(factory.name) : null;
  const visitId = asString(visit.id);
  if (factoryName === null || visitId === null) return [];
  const factoryCode = isRecord(factory) ? asString(factory.factory_code) : null;
  const visitType = asString(visit.visit_type);

  return normalizeEmbedded<Record<string, unknown>>(visit.inspections, "visits.inspections").flatMap(inspection => {
    const inspectionId = asString(inspection.id);
    const status = asString(inspection.status);
    if (inspectionId === null || status === null) return [];
    return normalizeEmbedded<VersionShape>(inspection.submission_versions, "inspections.submission_versions").map(version => ({
      inspectionId,
      visitId,
      factoryName,
      factoryCode,
      visitType,
      status,
      versionId: version.id,
      versionNumber: asNumber(version.version_number),
      submittedAt: version.submitted_at,
      submittedBy: version.submitted_by,
      snapshot: version.snapshot ?? {},
      acknowledgement: version.acknowledgement,
    }));
  });
}

export type CompletedHistoryData = {
  userId: string;
  records: readonly CompletedHistoryRecord[];
  liveReadFailed: boolean;
};

export async function loadCompletedHistory(): Promise<CompletedHistoryData | null> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return null;

  const read = await sb.from("assignments")
    .select(LIST_SELECT)
    .eq("inspector_id", user.id)
    .order("created_at", { ascending: false });
  if (read.error) logProviderError("field completed history", read.error);

  const rows = Array.isArray(read.data) ? read.data : [];
  const flattened = rows.flatMap(row => (isRecord(row) ? toRecords(row.visits) : []));

  return {
    userId: user.id,
    records: latestSubmittedVersions(flattened),
    liveReadFailed: Boolean(read.error),
  };
}

export type CompletedReceiptResult =
  | { status: "ok"; record: CompletedHistoryRecord }
  | { status: "unavailable" }
  | { status: "unauthenticated" };

export async function loadCompletedReceipt(id: string): Promise<CompletedReceiptResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return { status: "unauthenticated" };

  const read = await sb.from("assignments")
    .select(DETAIL_SELECT)
    .eq("inspector_id", user.id)
    .eq("visits.inspections.id", id)
    .maybeSingle();
  if (read.error) {
    logProviderError("field completed receipt", read.error);
    return { status: "unavailable" };
  }

  const record = toRecords(isRecord(read.data) ? read.data.visits : null)
    .filter(entry => entry.inspectionId === id)
    .sort((a, b) => b.versionNumber - a.versionNumber)[0];
  if (!record) return { status: "unavailable" };

  return { status: "ok", record };
}
