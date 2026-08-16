export type UiString = {
  key: string;
  en: string;
  ar: string | null;
  status: "draft" | "reviewed";
  context: string | null;
  orphaned: boolean;
  updated_at: string;
};

export type StringState = "missing" | "draft" | "reviewed" | "orphaned";

export type LocalizationFilter = "all" | StringState;

export type LocalizationQuery = {
  readonly filter: LocalizationFilter;
  readonly search: string;
  readonly page: number;
};

export const PAGE_SIZE = 12;

const FILTERS: readonly LocalizationFilter[] = ["all", "missing", "draft", "reviewed", "orphaned"];

export function isMissingArabic(row: UiString): boolean {
  return row.ar === null || row.ar.trim() === "";
}

export function stateOf(row: UiString): StringState {
  if (row.orphaned) return "orphaned";
  if (isMissingArabic(row)) return "missing";
  return row.status === "reviewed" ? "reviewed" : "draft";
}

export function parseLocalizationQuery(
  params: Record<string, string | string[] | undefined>,
): LocalizationQuery {
  const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const filter = FILTERS.find(candidate => candidate === one(params.filter)) ?? "all";
  const page = Number.parseInt(one(params.page) ?? "1", 10);
  return {
    filter,
    search: (one(params.q) ?? "").trim(),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function localizationHref(query: Partial<LocalizationQuery>): string {
  const params = new URLSearchParams();
  if (query.filter && query.filter !== "all") params.set("filter", query.filter);
  if (query.search) params.set("q", query.search);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `/admin/localization?${search}` : "/admin/localization";
}

export type StateCounts = Readonly<Record<LocalizationFilter, number>>;

export function countStates(rows: readonly UiString[]): StateCounts {
  const counts = { all: rows.length, missing: 0, draft: 0, reviewed: 0, orphaned: 0 };
  for (const row of rows) counts[stateOf(row)] += 1;
  return counts;
}

export function matchesQuery(row: UiString, query: LocalizationQuery): boolean {
  if (query.filter !== "all" && stateOf(row) !== query.filter) return false;
  if (!query.search) return true;
  const needle = query.search.toLowerCase();
  return row.key.toLowerCase().includes(needle)
    || row.en.toLowerCase().includes(needle)
    || (row.ar ?? "").toLowerCase().includes(needle);
}

export function runsLong(row: UiString): boolean {
  const ar = (row.ar ?? "").trim();
  return ar !== "" && row.en.trim() !== "" && ar.length > row.en.length * 1.3;
}

export function countRunsLong(rows: readonly UiString[]): number {
  return rows.filter(runsLong).length;
}

export function coverage(translated: number, total: number): number {
  return total === 0 ? 0 : Math.round((translated / total) * 100);
}
