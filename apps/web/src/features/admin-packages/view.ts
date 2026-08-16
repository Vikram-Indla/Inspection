export type ItemRule = {
  requirement?: "required" | "optional" | "conditional";
  conditional?: { visible_when?: string; mandatory_when_visible?: boolean };
  evidence_rule?: { on?: string; type?: string; min?: number; mandatory?: boolean } | null;
  scoring_enabled?: boolean;
  score_weight?: number | null;
  response_mapping?: Record<string, { result?: string; violation?: string; action_form?: string }>;
};

export type Section = {
  key: string;
  title?: string;
  title_en?: string;
  title_ar?: string;
  items?: string[];
  mandatory?: boolean;
  fields?: string[];
};

export type ActionFormDef = {
  key: string;
  title: string;
  blocking?: boolean;
  fields?: string[];
  template_version_id?: string;
};

export type Definition = {
  sections?: Section[];
  action_forms?: ActionFormDef[];
  item_rules?: Record<string, ItemRule>;
  template_refs?: string[];
};

export type VersionRow = {
  id: string;
  version_label: string;
  status: string;
  published_at: string | null;
  effective_from: string | null;
  effective_to: string | null;
  supersedes_id: string | null;
  definition: Definition;
};

export type PackageRow = {
  id: string;
  code: string;
  title: string;
  scope: string | null;
  package_versions: VersionRow[] | null;
};

export type PackageState = "published" | "draft" | "empty";

export type PackageFilter = "all" | PackageState;

export type PackagesTab = "designer" | "preview" | "impact" | "versions";

export type PackagesQuery = {
  readonly filter: PackageFilter;
  readonly search: string;
  readonly packageId: string;
  readonly versionId: string;
  readonly tab: PackagesTab | null;
};

export type PackageSelection = {
  readonly pkg: PackageRow;
  readonly version: VersionRow | null;
};

const FILTERS: readonly PackageFilter[] = ["all", "published", "draft", "empty"];

const TABS: readonly PackagesTab[] = ["designer", "preview", "impact", "versions"];

export function orderedVersions(pkg: PackageRow): readonly VersionRow[] {
  return [...(pkg.package_versions ?? [])].sort((a, b) => {
    const draftFirst = (a.status === "draft" ? 1 : 0) - (b.status === "draft" ? 1 : 0);
    if (draftFirst !== 0) return -draftFirst;
    return (b.published_at ?? b.version_label).localeCompare(a.published_at ?? a.version_label);
  });
}

export function currentPublished(pkg: PackageRow, today: string): VersionRow | null {
  return orderedVersions(pkg)
    .filter(version => (version.status === "published" || version.status === "locked")
      && (!version.effective_from || version.effective_from <= today)
      && (!version.effective_to || version.effective_to >= today))
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))[0] ?? null;
}

export function hasDraft(pkg: PackageRow): boolean {
  return (pkg.package_versions ?? []).some(version => version.status === "draft");
}

export function stateOf(pkg: PackageRow, today: string): PackageState {
  if (currentPublished(pkg, today)) return "published";
  if (hasDraft(pkg)) return "draft";
  return "empty";
}

export function definitionSize(version: VersionRow): { sections: number; items: number; actionForms: number } {
  const sections = version.definition.sections ?? [];
  return {
    sections: sections.length,
    items: sections.reduce((sum, section) => sum + (section.items?.length ?? 0), 0),
    actionForms: (version.definition.action_forms ?? []).length,
  };
}

export function isSuperseded(version: VersionRow, latest: VersionRow | null): boolean {
  return (version.status === "published" || version.status === "locked")
    && !!latest && latest.id !== version.id;
}

export function parsePackagesQuery(
  params: Record<string, string | string[] | undefined>,
): PackagesQuery {
  const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  return {
    filter: FILTERS.find(candidate => candidate === one(params.filter)) ?? "all",
    search: (one(params.q) ?? "").trim(),
    packageId: (one(params.package) ?? "").trim(),
    versionId: (one(params.version) ?? "").trim(),
    tab: TABS.find(candidate => candidate === one(params.tab)) ?? null,
  };
}

export function packagesHref(query: Partial<PackagesQuery>): string {
  const params = new URLSearchParams();
  if (query.filter && query.filter !== "all") params.set("filter", query.filter);
  if (query.search) params.set("q", query.search);
  if (query.packageId) params.set("package", query.packageId);
  if (query.versionId) params.set("version", query.versionId);
  if (query.tab) params.set("tab", query.tab);
  const search = params.toString();
  return search ? `/admin/packages?${search}` : "/admin/packages";
}

export function registerHref(query: PackagesQuery): string {
  return packagesHref({ filter: query.filter, search: query.search });
}

export function resolveSelection(
  packages: readonly PackageRow[],
  query: PackagesQuery,
): PackageSelection | null {
  if (!query.packageId) return null;
  const pkg = packages.find(candidate => candidate.id === query.packageId);
  if (!pkg) return null;
  const versions = orderedVersions(pkg);
  return {
    pkg,
    version: versions.find(version => version.id === query.versionId) ?? versions[0] ?? null,
  };
}

export function isEditableDraft(version: VersionRow | null, canWrite: boolean): boolean {
  return !!version && version.status === "draft" && canWrite;
}

export function availableTabs(canDesign: boolean): readonly PackagesTab[] {
  return canDesign ? TABS : TABS.filter(tab => tab !== "designer");
}

export function resolveTab(query: PackagesQuery, canDesign: boolean): PackagesTab {
  const tabs = availableTabs(canDesign);
  return tabs.find(tab => tab === query.tab) ?? tabs[0];
}

export type PackageCounts = Readonly<Record<PackageFilter, number>>;

export function matchesFilter(pkg: PackageRow, filter: PackageFilter, today: string): boolean {
  if (filter === "all") return true;
  if (filter === "draft") return hasDraft(pkg);
  return stateOf(pkg, today) === filter;
}

export function countStates(packages: readonly PackageRow[], today: string): PackageCounts {
  return {
    all: packages.length,
    published: packages.filter(pkg => matchesFilter(pkg, "published", today)).length,
    draft: packages.filter(pkg => matchesFilter(pkg, "draft", today)).length,
    empty: packages.filter(pkg => matchesFilter(pkg, "empty", today)).length,
  };
}

export function matchesQuery(pkg: PackageRow, query: PackagesQuery, today: string): boolean {
  if (!matchesFilter(pkg, query.filter, today)) return false;
  if (!query.search) return true;
  const needle = query.search.toLowerCase();
  return pkg.code.toLowerCase().includes(needle)
    || pkg.title.toLowerCase().includes(needle)
    || (pkg.scope ?? "").toLowerCase().includes(needle);
}
