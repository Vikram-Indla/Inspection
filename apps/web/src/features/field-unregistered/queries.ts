import { logProviderError } from "@/lib/neutral-error";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type InspectionPackageOption = {
  id: string;
  code: string;
  title: string;
};

export type UnregisteredData = {
  packages: readonly InspectionPackageOption[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toPackage(value: unknown): InspectionPackageOption | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  if (typeof id !== "string") return null;
  const pkg = Array.isArray(value.packages) ? value.packages[0] : value.packages;
  const meta = isRecord(pkg) ? pkg : null;
  return {
    id,
    code: `${asString(meta?.code)} · ${asString(value.version_label)}`,
    title: asString(meta?.title),
  };
}

export async function loadUnregistered(): Promise<UnregisteredData | null> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb.from("package_versions")
    .select("id, version_label, packages(code, title)")
    .in("status", ["published", "locked"])
    .lte("effective_from", today)
    .or(`effective_to.is.null,effective_to.gte.${today}`);
  if (error) logProviderError("field unregistered packages", error);

  const rows = Array.isArray(data) ? data : [];
  const packages = rows
    .map(toPackage)
    .filter((option): option is InspectionPackageOption => option !== null);

  return { packages };
}
