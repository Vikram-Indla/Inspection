import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { logProviderError } from "@/lib/neutral-error";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type FieldDraft = {
  inspectionId: string;
  factoryName: string;
  factoryCode: string | null;
};

export type FieldDraftsData = {
  userId: string;
  failed: boolean;
  drafts: readonly FieldDraft[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function unwrap(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

type NarrowedVisit = {
  planningStatus: string;
  factoryName: string;
  factoryCode: string | null;
  inspectionId: string | null;
  inspectionStatus: string | null;
};

function toVisit(value: unknown): NarrowedVisit | null {
  if (!isRecord(value)) return null;
  const planningStatus = asString(value.planning_status);
  const factory = unwrap(value.factories);
  if (planningStatus === null || !isRecord(factory)) return null;
  const factoryName = asString(factory.name);
  if (factoryName === null) return null;

  const inspection = unwrap(value.inspections);
  const inspectionRecord = isRecord(inspection) ? inspection : null;

  return {
    planningStatus,
    factoryName,
    factoryCode: asString(factory.factory_code),
    inspectionId: inspectionRecord ? asString(inspectionRecord.id) : null,
    inspectionStatus: inspectionRecord ? asString(inspectionRecord.status) : null,
  };
}

export async function loadFieldDrafts(): Promise<FieldDraftsData | null> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return null;

  const { data, error } = await sb.from("assignments")
    .select("visit_id, visits(id, planning_status, factories(name, factory_code), inspections(id, status))")
    .eq("inspector_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    logProviderError("field drafts", error);
    return { userId: user.id, failed: true, drafts: [] };
  }

  const rows = Array.isArray(data) ? data : [];
  const drafts = rows
    .map(row => (isRecord(row) ? toVisit(unwrap(row.visits)) : null))
    .filter((visit): visit is NarrowedVisit =>
      visit !== null && ["published", "expired"].includes(visit.planningStatus))
    .filter(visit => !isTestFixtureEstablishment({ name: visit.factoryName, factory_code: visit.factoryCode }))
    .filter(visit => visit.inspectionStatus === "in_progress" && visit.inspectionId !== null)
    .map(visit => ({
      inspectionId: visit.inspectionId ?? "",
      factoryName: visit.factoryName,
      factoryCode: visit.factoryCode,
    }));

  return { userId: user.id, failed: false, drafts };
}
