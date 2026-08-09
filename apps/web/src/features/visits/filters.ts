import type { SelectOption } from "@/components/saqeel/select/select";
import type { PlanningListParams, PlanningTab } from "@/lib/planning/visit-list";
import type { VisitFilterChip } from "@/components/sections/visits/visit-filter-bar/visit-filter-bar";
import type { VisitStatusTile } from "@/components/sections/visits/visit-status-tiles/visit-status-tiles";
import { VISIT_STATUS_TABS, visitHref, type VisitRouteBase, type VisitSearchParams } from "./params";
import type { VisitLookupOption, VisitManagementData } from "./queries";

export type VisitFilterMessages = {
  readonly allStatuses: string;
  readonly allTypes: string;
  readonly allModes: string;
  readonly allRegions: string;
  readonly allCities: string;
  readonly status: string;
  readonly type: string;
  readonly mode: string;
  readonly region: string;
  readonly city: string;
  readonly window: string;
  readonly searchLabel: string;
  readonly sortLabels: Record<string, string>;
};

export const VISIT_ADVANCED_KEYS = ["visitType", "executionMode", "region", "city"] as const;

const lookupOptions = (
  options: readonly VisitLookupOption[],
  locale: "ar" | "en",
  all: string,
): SelectOption[] => [
  { value: "", label: all },
  ...options.map(option => ({
    value: option.key,
    label: locale === "ar" ? (option.labelAr ?? option.labelEn) : option.labelEn,
  })),
];

const plainOptions = (values: readonly string[], all: string): SelectOption[] =>
  [{ value: "", label: all }, ...values.map(value => ({ value, label: value }))];

export function buildVisitSelectOptions(
  data: VisitManagementData,
  locale: "ar" | "en",
  messages: VisitFilterMessages,
  statusLabel: (tab: PlanningTab) => string,
  countsAvailable: boolean,
  counts: Record<string, number>,
) {
  const statusOptions: SelectOption[] = [
    { value: "", label: messages.allStatuses, count: countsAvailable ? counts.all : undefined },
    ...VISIT_STATUS_TABS.map(tab => ({
      value: tab,
      label: statusLabel(tab),
      count: countsAvailable ? counts[tab] : undefined,
    })),
  ];
  return {
    statusOptions,
    visitTypeOptions: lookupOptions(data.visitTypes, locale, messages.allTypes),
    modeOptions: lookupOptions(data.visitModes, locale, messages.allModes),
    regionOptions: plainOptions(data.regions, messages.allRegions),
    cityOptions: plainOptions(data.cities, messages.allCities),
  };
}

export function buildVisitStatusTiles(
  base: VisitRouteBase,
  sp: VisitSearchParams,
  params: PlanningListParams,
  counts: Record<string, number>,
  countsAvailable: boolean,
  statusLabel: (tab: PlanningTab) => string,
): VisitStatusTile[] {
  return VISIT_STATUS_TABS.map(tab => ({
    key: tab,
    label: statusLabel(tab),
    count: countsAvailable ? (counts[tab] ?? 0) : null,
    href: visitHref(base, sp, { tab: params.tab === tab ? "" : tab, limit: "" }),
    active: params.tab === tab,
  }));
}

export function buildVisitFilterChips(
  base: VisitRouteBase,
  sp: VisitSearchParams,
  params: PlanningListParams,
  messages: VisitFilterMessages,
  statusLabel: (tab: PlanningTab) => string,
  optionLabel: (key: (typeof VISIT_ADVANCED_KEYS)[number], value: string) => string,
): VisitFilterChip[] {
  const advanced = VISIT_ADVANCED_KEYS.map(key => {
    const value = params.filters[key];
    if (!value) return null;
    const field = key === "visitType" ? messages.type
      : key === "executionMode" ? messages.mode
        : key === "region" ? messages.region : messages.city;
    const param = key === "executionMode" ? "mode" : key;
    return {
      key,
      label: `${field} · ${optionLabel(key, value)}`,
      href: visitHref(base, sp, { [param]: "", limit: "" }),
    };
  });

  const window = params.filters.windowFrom || params.filters.windowTo
    ? {
      key: "window",
      label: `${messages.window} · ${params.filters.windowFrom || "…"} — ${params.filters.windowTo || "…"}`,
      href: visitHref(base, sp, { windowFrom: "", windowTo: "", limit: "" }),
    }
    : null;

  return [
    params.search ? { key: "q", label: `${messages.searchLabel} · ${params.search}`, href: visitHref(base, sp, { q: "", limit: "" }) } : null,
    params.tab !== "all" ? { key: "tab", label: `${messages.status} · ${statusLabel(params.tab)}`, href: visitHref(base, sp, { tab: "", limit: "" }) } : null,
    window,
    ...advanced,
  ].filter((chip): chip is VisitFilterChip => chip !== null);
}
