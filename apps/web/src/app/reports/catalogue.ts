// Governed report catalogue reads shared by the SAQEEL report surfaces.
//
// Every row here comes from a governed table:
//   packages / package_versions        — M09-030, the published report types
//                                        (a "report type" is a published
//                                        package version, never a hardcoded
//                                        report page)
//   configuration_templates            — M09 governed configuration, the
//                                        report and action-form templates
//   visit_preparations                 — TASK-EXECUTION-MODULE-001 Phase 3A
//   visit_package_snapshots            — the immutable per-Ready snapshot
//
// Nothing in this module invents a report type, a record type, a delta count
// or a package content list. A surface with no governed row renders
// "Not configured" and names what a sponsor must supply.
import { supabaseServer } from "@/lib/supabase-server";

export type PackageSection = {
  key: string;
  title: string;
  items?: string[];
  fields?: string[];
  mandatory?: boolean;
  optional?: boolean;
  removable?: boolean;
};
export type PackageActionForm = { key: string; title: string; blocking?: boolean; fields?: string[] };
export type PackageDefinition = { sections?: PackageSection[]; action_forms?: PackageActionForm[] };

export type PackageVersionRow = {
  id: string;
  version_label: string;
  status: string;
  definition: PackageDefinition;
  published_at: string | null;
};
export type PackageRow = {
  id: string;
  code: string;
  title: string;
  scope: string | null;
  package_versions: PackageVersionRow[];
};

export type TemplateRow = {
  id: string;
  template_key: string;
  template_type: string;
  version_label: string;
  title_en: string;
  title_ar: string;
  status: string;
  published_at: string | null;
  effective_from: string | null;
  effective_to: string | null;
};

export type CatalogueLoad<T> = { rows: T[]; failed: boolean };

/** A published package version is the governed expression of a report type. */
export function publishedVersions(p: PackageRow): PackageVersionRow[] {
  return (p.package_versions ?? [])
    .filter(v => v.status === "published")
    .sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")));
}

/** The version a report type is currently expressed by, if any. */
export function currentVersion(p: PackageRow): PackageVersionRow | undefined {
  return publishedVersions(p)[0];
}

export function sectionsOf(v: PackageVersionRow | undefined): PackageSection[] {
  return v?.definition?.sections ?? [];
}

/** D-007 fail closed — a section is removable only when the definition says so. */
export function isOptionalSection(s: PackageSection): boolean {
  return (s.optional === true || s.removable === true) && s.mandatory !== true;
}

export async function loadPackages(): Promise<CatalogueLoad<PackageRow>> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("packages")
    .select("id, code, title, scope, package_versions(id, version_label, status, definition, published_at)")
    .order("code");
  if (error) {
    console.error("[reports catalogue] packages load failed", error);
    return { rows: [], failed: true };
  }
  return { rows: (data as unknown as PackageRow[]) ?? [], failed: false };
}

export async function loadTemplates(types: string[]): Promise<CatalogueLoad<TemplateRow>> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("configuration_templates")
    .select("id, template_key, template_type, version_label, title_en, title_ar, status, published_at, effective_from, effective_to")
    .in("template_type", types)
    .order("template_key");
  if (error) {
    console.error("[reports catalogue] configuration_templates load failed", error);
    return { rows: [], failed: true };
  }
  return { rows: (data as unknown as TemplateRow[]) ?? [], failed: false };
}

/** Governed config status → the governed .badge appearance. No bare colour. */
export function statusBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case "published":
      return "badge-compliant";
    case "locked":
      return "badge-completed";
    case "retired":
    case "superseded":
      return "badge-disabled";
    case "draft":
      return "badge-draft";
    default:
      return "badge-outline";
  }
}
