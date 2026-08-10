"use client";

import { useState } from "react";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import type { PlanningListParams } from "@/lib/planning/visit-list";
import type { PlanningInspectorOption, PlanningLookupOption } from "@/features/planning/queries";
import type { Locale } from "@/lib/i18n";
import { resolveRegionId, KSA_REGION_LABELS } from "@/lib/ksa-regions";
import MoreFilters, { type MoreFiltersValues } from "./more-filters";
import type { PlanningToolbarOptions, PlanningToolbarStrings } from "./planning-toolbar";

type FilterState = MoreFiltersValues & {
  tab: string;
  visitType: string;
  priority: string;
  inspectorId: string;
};

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
  const [filters, setFilters] = useState<FilterState>({
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
  });

  const patch = (next: Partial<FilterState>) => setFilters(current => ({ ...current, ...next }));
  const bind = (key: keyof FilterState) => (value: string) => patch({ [key]: value });

  const all = (label: string, values: readonly SelectOption[]): SelectOption[] =>
    [{ value: "", label }, ...values];
  const fromLookups = (lookups: readonly PlanningLookupOption[]): SelectOption[] =>
    lookups.map(option => ({ value: option.key, label: lookupLabel(option, locale) }));
  const fromInspectors = (inspectors: readonly PlanningInspectorOption[]): SelectOption[] =>
    inspectors.map(option => ({ value: option.userId, label: option.label }));

  return (
    <>
      {Object.entries(filters).map(([name, value]) => (
        <input type="hidden" name={name} value={value} key={name} />
      ))}

      <Field label={strings.status}>
        <SaqeelSelect options={options.tabs} value={filters.tab} onChange={bind("tab")} label={strings.status} />
      </Field>
      <Field label={strings.visitType}>
        <SaqeelSelect
          options={all(strings.allOption, fromLookups(options.visitTypes))}
          value={filters.visitType}
          onChange={bind("visitType")}
          label={strings.visitType}
        />
      </Field>
      <Field label={strings.priority}>
        <SaqeelSelect
          options={all(strings.allOption, fromLookups(options.priorities))}
          value={filters.priority}
          onChange={bind("priority")}
          label={strings.priority}
        />
      </Field>
      <Field label={strings.inspector}>
        <SaqeelSelect
          options={all(strings.allInspectors, fromInspectors(options.inspectors))}
          value={filters.inspectorId}
          onChange={bind("inspectorId")}
          label={strings.inspector}
        />
      </Field>

      <MoreFilters
        strings={strings}
        locale={locale}
        values={filters}
        onChange={patch}
        options={{
          methods: all(strings.allOption, options.methods),
          regions: all(strings.allOption, options.regions.map(region => ({ value: region, label: regionLabel(region, locale) }))),
          cities: all(strings.allOption, options.cities.map(city => ({ value: city, label: city }))),
          sortKeys: options.sortKeys.map(key => ({ value: key, label: strings.sort[key] ?? key })),
        }}
      />
    </>
  );
}
