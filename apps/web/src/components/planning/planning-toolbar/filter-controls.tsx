"use client";

import { useRouter, useSearchParams } from "next/navigation";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import type { PlanningListParams } from "@/lib/planning/visit-list";
import type { PlanningInspectorOption, PlanningLookupOption } from "@/features/planning/queries";
import type { Locale } from "@/lib/i18n";
import { resolveRegionId, KSA_REGION_LABELS } from "@/lib/ksa-regions";
import MoreFilters from "./more-filters";
import type { PlanningToolbarOptions, PlanningToolbarStrings } from "./planning-toolbar";

type FilterValues = {
  tab: string;
  visitType: string;
  priority: string;
  inspectorId: string;
  method: string;
  region: string;
  city: string;
  windowFrom: string;
  windowTo: string;
  sort: string;
};

const PANEL_KEYS = [
  "visitType", "priority", "inspectorId", "method", "region", "city", "windowFrom", "windowTo",
] as const;

const lookupLabel = (option: PlanningLookupOption, locale: Locale) =>
  locale === "ar" ? (option.labelAr ?? option.labelEn) : option.labelEn;

const regionLabel = (region: string, locale: Locale) => {
  const id = resolveRegionId(region);
  if (!id) return region;
  return locale === "ar" ? KSA_REGION_LABELS[id].ar : KSA_REGION_LABELS[id].en;
};

export default function FilterControls({ strings, options, params, locale }: {
  strings: PlanningToolbarStrings;
  options: PlanningToolbarOptions;
  params: PlanningListParams;
  locale: Locale;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const values: FilterValues = {
    tab: params.tab === "all" ? "" : params.tab,
    visitType: params.filters.visitType ?? "",
    priority: params.filters.priority ?? "",
    inspectorId: params.filters.inspectorId ?? "",
    method: params.filters.method ?? "",
    region: params.filters.region ?? "",
    city: params.filters.city ?? "",
    windowFrom: params.filters.windowFrom ?? "",
    windowTo: params.filters.windowTo ?? "",
    sort: params.sort,
  };

  const apply = (patch: Partial<FilterValues>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    const query = next.toString();
    router.replace(query ? `/planning?${query}` : "/planning", { scroll: false });
  };

  const resettable = (label: string, entries: readonly SelectOption[]): SelectOption[] =>
    [{ value: "", label }, ...entries];
  const fromLookups = (lookups: readonly PlanningLookupOption[]): SelectOption[] =>
    lookups.map(option => ({ value: option.key, label: lookupLabel(option, locale) }));
  const fromInspectors = (inspectors: readonly PlanningInspectorOption[]): SelectOption[] =>
    inspectors.map(option => ({ value: option.userId, label: option.label }));

  const activeCount = PANEL_KEYS.filter(key => values[key]).length;

  return (
    <>
      {Object.entries(values).map(([name, value]) => (
        <input type="hidden" name={name} value={value} key={name} />
      ))}

      <SaqeelSelect
        options={options.tabs}
        value={values.tab}
        onChange={tab => apply({ tab })}
        label={strings.status}
      />

      <MoreFilters
        strings={strings}
        locale={locale}
        values={values}
        onChange={apply}
        activeCount={activeCount}
        options={{
          visitTypes: resettable(strings.visitType, fromLookups(options.visitTypes)),
          priorities: resettable(strings.priority, fromLookups(options.priorities)),
          inspectors: resettable(strings.inspector, fromInspectors(options.inspectors)),
          methods: resettable(strings.method, options.methods),
          regions: resettable(strings.region, options.regions.map(region => ({ value: region, label: regionLabel(region, locale) }))),
          cities: resettable(strings.city, options.cities.map(city => ({ value: city, label: city }))),
          sortKeys: options.sortKeys.map(key => ({ value: key, label: strings.sort[key] ?? key })),
        }}
      />
    </>
  );
}
