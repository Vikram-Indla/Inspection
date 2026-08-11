import Button from "@/components/saqeel/button/button";
import type { PlanningListParams } from "@/lib/planning/visit-list";
import type { PlanningInspectorOption, PlanningLookupOption } from "@/features/planning/queries";
import type { Locale } from "@/lib/i18n";
import FilterControls from "./filter-controls";
import styles from "./planning-toolbar.module.css";

export type PlanningToolbarStrings = {
  label: string;
  searchLabel: string;
  searchPlaceholder: string;
  status: string;
  visitType: string;
  priority: string;
  inspector: string;
  allInspectors: string;
  allOption: string;
  moreFilters: string;
  method: string;
  region: string;
  city: string;
  windowFrom: string;
  windowTo: string;
  sortLabel: string;
  sort: Record<string, string>;
  apply: string;
  clearAll: string;
  datePlaceholder: string;
  dateClear: string;
  dateToday: string;
  monthPrevious: string;
  monthNext: string;
};

export type PlanningToolbarOptions = {
  tabs: { value: string; label: string }[];
  visitTypes: PlanningLookupOption[];
  priorities: PlanningLookupOption[];
  inspectors: PlanningInspectorOption[];
  regions: string[];
  cities: string[];
  methods: { value: string; label: string }[];
  sortKeys: string[];
};

export default function PlanningToolbar({ strings, options, params, formId, locale, hasFilters }: {
  strings: PlanningToolbarStrings;
  options: PlanningToolbarOptions;
  params: PlanningListParams;
  formId: string;
  locale: Locale;
  hasFilters: boolean;
}) {
  return (
    <form id={formId} className={styles.bar} method="get" action="/planning" role="search" aria-label={strings.label}>
      <input
        className={styles.input}
        type="search"
        name="q"
        defaultValue={params.search}
        placeholder={strings.searchPlaceholder}
        aria-label={strings.searchLabel}
      />

      <FilterControls strings={strings} options={options} params={params} locale={locale} />

      {hasFilters ? (
        <div className={styles.actions}>
          <Button variant="link" href="/planning" label={strings.clearAll}>{strings.clearAll}</Button>
        </div>
      ) : null}
    </form>
  );
}
