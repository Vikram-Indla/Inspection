import type { SupabaseClient } from "@supabase/supabase-js";

export type ComplianceReport = {
  readonly id: string;
  readonly reference: string | null;
  readonly recordedAt: string | null;
  readonly status: string | null;
  readonly decision: string | null;
  readonly decidedAt: string | null;
};

export type ComplianceViolation = {
  readonly id: string;
  readonly title: string | null;
  readonly code: string | null;
  readonly level: string | null;
  readonly recordedAt: string | null;
};

export type CompliancePenalty = {
  readonly id: string;
  readonly noticeNumber: string;
  readonly status: string;
  readonly issuedAt: string | null;
  readonly violationTitle: string | null;
};

export type FactoryCompliance = {
  readonly reports: readonly ComplianceReport[];
  readonly violations: readonly ComplianceViolation[];
  readonly penalties: readonly CompliancePenalty[];
};

/**
 * `penalty_notices` is readable only by reviewer / ops / auditor /
 * compliance_admin / leadership. Everyone else gets an empty set, which is not
 * the same as "this factory has no penalties" — the two must never render the
 * same way, so the caller is told which it is.
 */
export type FactoryComplianceResult = {
  readonly byFactory: ReadonlyMap<string, FactoryCompliance>;
  readonly penaltiesReadable: boolean;
};

const EMPTY: FactoryCompliance = { reports: [], violations: [], penalties: [] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const rows = (data: unknown): Record<string, unknown>[] =>
  Array.isArray(data) ? data.filter(isRecord) : [];

const text = (source: Record<string, unknown>, key: string): string | null => {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

const embed = (source: Record<string, unknown>, key: string): Record<string, unknown> | null => {
  const value = source[key];
  return isRecord(value) ? value : null;
};

const byRecent = (a: { recordedAt: string | null }, b: { recordedAt: string | null }) =>
  (b.recordedAt ?? "").localeCompare(a.recordedAt ?? "");

export async function queryFactoryCompliance(
  sb: SupabaseClient,
  factoryIds: readonly string[],
): Promise<FactoryComplianceResult> {
  if (factoryIds.length === 0) return { byFactory: new Map(), penaltiesReadable: true };

  const ids = [...factoryIds];
  const [inspectionRead, penaltyRead] = await Promise.all([
    sb.from("inspections")
      .select("id, status, started_at, submitted_at, visits!inner(factory_id, visit_reference)")
      .in("visits.factory_id", ids),
    sb.from("penalty_notices")
      .select("id, factory_id, notice_number, status, issued_at, violation_id")
      .in("factory_id", ids)
      .order("issued_at", { ascending: false }),
  ]);

  if (inspectionRead.error) console.error(`[factories.compliance] inspections failed: ${inspectionRead.error.message}`);
  if (penaltyRead.error) console.error(`[factories.compliance] penalties failed: ${penaltyRead.error.message}`);

  const inspectionRows = rows(inspectionRead.data);
  const inspectionIds = inspectionRows.map(row => text(row, "id")).filter((id): id is string => id !== null);
  const factoryOfInspection = new Map<string, string>();
  for (const row of inspectionRows) {
    const id = text(row, "id");
    const factoryId = embed(row, "visits") ? text(embed(row, "visits") ?? {}, "factory_id") : null;
    if (id && factoryId) factoryOfInspection.set(id, factoryId);
  }

  const [reviewRead, violationRead] = inspectionIds.length === 0
    ? [null, null]
    : await Promise.all([
      sb.from("reviews").select("inspection_id, decision, decided_at").in("inspection_id", inspectionIds),
      sb.from("violations")
        .select("id, inspection_id, violation_codes(code, title, level)")
        .in("inspection_id", inspectionIds)
        .is("invalidated_at", null),
    ]);

  if (reviewRead?.error) console.error(`[factories.compliance] reviews failed: ${reviewRead.error.message}`);
  if (violationRead?.error) console.error(`[factories.compliance] violations failed: ${violationRead.error.message}`);

  const reviewOf = new Map<string, { decision: string | null; decidedAt: string | null }>();
  for (const row of rows(reviewRead?.data)) {
    const inspectionId = text(row, "inspection_id");
    if (inspectionId) reviewOf.set(inspectionId, { decision: text(row, "decision"), decidedAt: text(row, "decided_at") });
  }

  const violationTitle = new Map<string, string>();
  const byFactory = new Map<string, { reports: ComplianceReport[]; violations: ComplianceViolation[]; penalties: CompliancePenalty[] }>();
  const bucket = (factoryId: string) => {
    const held = byFactory.get(factoryId) ?? { reports: [], violations: [], penalties: [] };
    byFactory.set(factoryId, held);
    return held;
  };

  for (const row of inspectionRows) {
    const id = text(row, "id");
    const factoryId = id ? factoryOfInspection.get(id) : null;
    if (!id || !factoryId) continue;
    const review = reviewOf.get(id);
    bucket(factoryId).reports.push({
      id,
      reference: text(embed(row, "visits") ?? {}, "visit_reference"),
      recordedAt: text(row, "submitted_at") ?? text(row, "started_at"),
      status: text(row, "status"),
      decision: review?.decision ?? null,
      decidedAt: review?.decidedAt ?? null,
    });
  }

  for (const row of rows(violationRead?.data)) {
    const id = text(row, "id");
    const inspectionId = text(row, "inspection_id");
    const factoryId = inspectionId ? factoryOfInspection.get(inspectionId) : null;
    if (!id || !factoryId) continue;
    const code = embed(row, "violation_codes");
    const title = code ? text(code, "title") : null;
    if (title) violationTitle.set(id, title);
    const source = inspectionRows.find(inspection => text(inspection, "id") === inspectionId);
    bucket(factoryId).violations.push({
      id,
      title,
      code: code ? text(code, "code") : null,
      level: code ? text(code, "level") : null,
      recordedAt: source ? text(source, "submitted_at") ?? text(source, "started_at") : null,
    });
  }

  for (const row of rows(penaltyRead.data)) {
    const id = text(row, "id");
    const factoryId = text(row, "factory_id");
    const noticeNumber = text(row, "notice_number");
    const status = text(row, "status");
    if (!id || !factoryId || !noticeNumber || !status) continue;
    const violationId = text(row, "violation_id");
    bucket(factoryId).penalties.push({
      id,
      noticeNumber,
      status,
      issuedAt: text(row, "issued_at"),
      violationTitle: violationId ? violationTitle.get(violationId) ?? null : null,
    });
  }

  const sorted = new Map<string, FactoryCompliance>();
  for (const [factoryId, held] of byFactory) {
    sorted.set(factoryId, {
      reports: [...held.reports].sort(byRecent),
      violations: [...held.violations].sort(byRecent),
      penalties: held.penalties,
    });
  }
  for (const factoryId of ids) if (!sorted.has(factoryId)) sorted.set(factoryId, EMPTY);

  return { byFactory: sorted, penaltiesReadable: !penaltyRead.error };
}
