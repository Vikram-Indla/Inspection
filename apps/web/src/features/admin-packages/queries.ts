import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { logProviderError } from "@/lib/neutral-error";
import { riyadhToday } from "@/lib/dates";
import {
  countStates,
  matchesQuery,
  type PackageCounts,
  type PackageRow,
  type PackagesQuery,
} from "./view";

const WRITER_ROLES = ["admin", "compliance_admin", "form_admin"] as const;
const READER_ROLES = [...WRITER_ROLES, "reviewer"] as const;

export type ItemRow = {
  id: string; code: string; title: string; active: boolean;
  response_model: Record<string, unknown> | null;
  evidence_rule: Record<string, unknown> | null;
  score_weight: number | null; score_excluded_on: string[] | null;
  guidance_en: string | null; guidance_ar: string | null;
  regulation_clauses: { clause_ref: string; legal_source: string | null } | null;
};

export type TemplateRow = {
  id: string; template_key: string; template_type: string; version_label: string;
  title_en: string; title_ar: string; schema: unknown; status: string; effective_from: string | null;
};

export type PackagesData = {
  readonly packages: readonly PackageRow[];
  readonly counts: PackageCounts;
  readonly items: readonly ItemRow[];
  readonly templates: readonly TemplateRow[];
  readonly violations: readonly { code: string; title: string }[];
  readonly today: string;
  readonly canWrite: boolean;
  readonly permissionUnknown: boolean;
  readonly itemBankUnavailable: boolean;
  readonly templatesUnavailable: boolean;
};

export type PackagesResult =
  | { readonly kind: "unauthorized" }
  | { readonly kind: "error" }
  | { readonly kind: "ok"; readonly data: PackagesData };

function toPackageRow(row: Record<string, unknown>): PackageRow {
  return {
    id: String(row.id),
    code: String(row.code),
    title: String(row.title),
    scope: row.scope === null || row.scope === undefined ? null : String(row.scope),
    package_versions: (row.package_versions ?? null) as PackageRow["package_versions"],
  };
}

function toItemRow(row: Record<string, unknown>): ItemRow {
  return row as ItemRow;
}

function toTemplateRow(row: Record<string, unknown>): TemplateRow {
  return row as TemplateRow;
}

export async function canReadPackages(): Promise<boolean> {
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();
  if (!user) return false;
  const { data, error } = await sb.from("user_roles").select("role_key").eq("user_id", user.id);
  if (error) return false;
  const roles = new Set((data ?? []).map(row => row.role_key));
  return READER_ROLES.some(role => roles.has(role));
}

export async function loadPackages(query: PackagesQuery): Promise<PackagesResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();
  if (!user) return { kind: "unauthorized" };

  const [packageRead, itemRead, templateRead, violationRead, roleRead] = await Promise.all([
    sb.from("packages")
      .select("id, code, title, scope, package_versions(id, version_label, status, published_at, effective_from, effective_to, supersedes_id, definition)")
      .order("code"),
    sb.from("inspection_items")
      .select("id, code, title, active, response_model, evidence_rule, score_weight, score_excluded_on, guidance_en, guidance_ar, regulation_clauses(clause_ref, legal_source)")
      .order("code"),
    sb.from("configuration_templates")
      .select("id, template_key, template_type, version_label, title_en, title_ar, schema, status, effective_from")
      .order("template_key"),
    sb.from("violation_codes").select("code, title, status").in("status", ["published", "locked"]).order("code"),
    sb.from("user_roles").select("role_key").eq("user_id", user.id),
  ]);

  for (const [scope, read] of [
    ["packages", packageRead], ["item bank", itemRead],
    ["templates", templateRead], ["violations", violationRead], ["roles", roleRead],
  ] as const) {
    if (read.error) logProviderError(`admin packages ${scope} read`, read.error);
  }

  const roles = new Set((roleRead.data ?? []).map(row => row.role_key));
  if (!roleRead.error && !READER_ROLES.some(role => roles.has(role))) return { kind: "unauthorized" };
  if (packageRead.error) return { kind: "error" };

  const today = riyadhToday();
  const all: readonly PackageRow[] = (packageRead.data ?? []).map(toPackageRow);

  return {
    kind: "ok",
    data: {
      packages: all.filter(pkg => matchesQuery(pkg, query, today)),
      counts: countStates(all, today),
      items: (itemRead.data ?? []).map(toItemRow),
      templates: (templateRead.data ?? []).map(toTemplateRow),
      violations: (violationRead.data ?? []) as { code: string; title: string }[],
      today,
      canWrite: !roleRead.error && WRITER_ROLES.some(role => roles.has(role)),
      permissionUnknown: !!roleRead.error,
      itemBankUnavailable: !!itemRead.error,
      templatesUnavailable: !!templateRead.error,
    },
  };
}
