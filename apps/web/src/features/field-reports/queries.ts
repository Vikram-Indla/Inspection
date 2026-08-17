import { logProviderError } from "@/lib/neutral-error";
import type { CachedSubmittedReport } from "@/lib/offline";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

const VERSION_COLUMNS = "id, version_number, submitted_at, snapshot, acknowledgement, profiles(full_name)";
const LIST_SELECT = `visit_id, visits(id, visit_type, factories(name, factory_code), inspections(id, status, submission_versions(${VERSION_COLUMNS})))`;

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

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function profileName(versionRow: Record<string, unknown>): string | null {
  const profile = unwrap(versionRow.profiles);
  return isRecord(profile) ? asString(profile.full_name) : null;
}

type LatestVersion = {
  id: string;
  versionNumber: number;
  submittedAt: string | null;
  snapshot: unknown;
  acknowledgement: unknown;
  inspectorName: string | null;
};

function latestVersion(versionsValue: unknown): LatestVersion | null {
  const versions = asArray(versionsValue)
    .filter(isRecord)
    .map((row): LatestVersion | null => {
      const id = asString(row.id);
      if (id === null) return null;
      return {
        id,
        versionNumber: asNumber(row.version_number),
        submittedAt: asString(row.submitted_at),
        snapshot: row.snapshot ?? null,
        acknowledgement: row.acknowledgement ?? null,
        inspectorName: profileName(row),
      };
    })
    .filter((row): row is LatestVersion => row !== null)
    .sort((a, b) => b.versionNumber - a.versionNumber);
  return versions[0] ?? null;
}

function toReport(visitValue: unknown, cachedAt: string): CachedSubmittedReport | null {
  const visit = unwrap(visitValue);
  if (!isRecord(visit)) return null;
  const factory = unwrap(visit.factories);
  const inspection = unwrap(visit.inspections);
  if (!isRecord(factory) || !isRecord(inspection)) return null;
  const inspectionId = asString(inspection.id);
  if (inspectionId === null) return null;
  const latest = latestVersion(inspection.submission_versions);
  if (latest === null) return null;

  return {
    schema: "saqeel-submitted-report-v1",
    inspectionId,
    submissionVersionId: latest.id,
    versionNumber: latest.versionNumber,
    submittedAt: latest.submittedAt,
    snapshot: latest.snapshot,
    acknowledgement: latest.acknowledgement,
    factoryName: asString(factory.name),
    factoryCode: asString(factory.factory_code),
    inspectorName: latest.inspectorName,
    cachedAt,
  };
}

export type SubmittedReportsData = {
  userId: string;
  reports: readonly CachedSubmittedReport[];
  liveReadFailed: boolean;
};

export async function loadSubmittedReports(): Promise<SubmittedReportsData | null> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return null;

  const read = await sb.from("assignments")
    .select(LIST_SELECT)
    .eq("inspector_id", user.id)
    .order("created_at", { ascending: false });
  if (read.error) logProviderError("field submitted reports", read.error);

  const cachedAt = new Date().toISOString();
  const rows = Array.isArray(read.data) ? read.data : [];
  const reports = rows
    .flatMap(row => (isRecord(row) ? [toReport(row.visits, cachedAt)] : []))
    .filter((report): report is CachedSubmittedReport => report !== null)
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

  return { userId: user.id, reports, liveReadFailed: Boolean(read.error) };
}
