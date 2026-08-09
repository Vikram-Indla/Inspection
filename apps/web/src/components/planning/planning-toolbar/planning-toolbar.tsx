import Icon from "@/components/saqeel/icon/icon";
import type { PlanningListParams } from "@/lib/planning/visit-list";
import type { PlanningInspectorOption, PlanningLookupOption } from "@/features/planning/queries";
import type { Locale } from "@/lib/i18n";
import { resolveRegionId, KSA_REGION_LABELS } from "@/lib/ksa-regions";
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

const lookupLabel = (option: PlanningLookupOption, locale: Locale) =>
  locale === "ar" ? (option.labelAr ?? option.labelEn) : option.labelEn;

const regionLabel = (region: string, locale: Locale) => {
  const id = resolveRegionId(region);
  if (!id) return region;
  return locale === "ar" ? KSA_REGION_LABELS[id].ar : KSA_REGION_LABELS[id].en;
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
    <form id={formId} className={styles.root} method="get" action="/planning" aria-label={strings.label}>
      <div className={styles.search}>
        <Icon name="search" size="sm" />
        <label className={styles.srOnly} htmlFor="planning-search">{strings.searchLabel}</label>
        <input
          id="planning-search"
          className={styles.searchInput}
          type="search"
          name="q"
          defaultValue={params.search}
          placeholder={strings.searchPlaceholder}
        />
      </div>
      <label className={styles.chip}>
        <span className={styles.chipLabel}>{strings.status}</span>
        <select className={styles.select} name="tab" defaultValue={params.tab === "all" ? "" : params.tab}>
          {options.tabs.map(tab => <option key={tab.value || "all"} value={tab.value}>{tab.label}</option>)}
        </select>
      </label>
      <label className={styles.chip}>
        <span className={styles.chipLabel}>{strings.visitType}</span>
        <select className={styles.select} name="visitType" defaultValue={params.filters.visitType ?? ""}>
          <option value="">{strings.allOption}</option>
          {options.visitTypes.map(option => <option key={option.key} value={option.key}>{lookupLabel(option, locale)}</option>)}
        </select>
      </label>
      <label className={styles.chip}>
        <span className={styles.chipLabel}>{strings.priority}</span>
        <select className={styles.select} name="priority" defaultValue={params.filters.priority ?? ""}>
          <option value="">{strings.allOption}</option>
          {options.priorities.map(option => <option key={option.key} value={option.key}>{lookupLabel(option, locale)}</option>)}
        </select>
      </label>
      <label className={styles.chip}>
        <span className={styles.chipLabel}>{strings.inspector}</span>
        <select className={styles.select} name="inspectorId" defaultValue={params.filters.inspectorId ?? ""}>
          <option value="">{strings.allInspectors}</option>
          {options.inspectors.map(option => <option key={option.userId} value={option.userId}>{option.label}</option>)}
        </select>
      </label>
      <details className={styles.more}>
        <summary className={styles.moreTrigger}>
          {strings.moreFilters}
          <Icon name="disclosure" size="sm" />
        </summary>
        <div className={styles.moreGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{strings.method}</span>
            <select className={styles.select} name="method" defaultValue={params.filters.method ?? ""}>
              <option value="">{strings.allOption}</option>
              {options.methods.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{strings.region}</span>
            <select className={styles.select} name="region" defaultValue={params.filters.region ?? ""}>
              <option value="">{strings.allOption}</option>
              {options.regions.map(region => <option key={region} value={region}>{regionLabel(region, locale)}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{strings.city}</span>
            <select className={styles.select} name="city" defaultValue={params.filters.city ?? ""}>
              <option value="">{strings.allOption}</option>
              {options.cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{strings.windowFrom}</span>
            <input className={styles.select} type="date" name="windowFrom" defaultValue={params.filters.windowFrom ?? ""} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{strings.windowTo}</span>
            <input className={styles.select} type="date" name="windowTo" defaultValue={params.filters.windowTo ?? ""} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{strings.sortLabel}</span>
            <select className={styles.select} name="sort" defaultValue={params.sort}>
              {options.sortKeys.map(key => <option key={key} value={key}>{strings.sort[key] ?? key}</option>)}
            </select>
          </label>
        </div>
      </details>
      <span className={styles.spacer} />
      {hasFilters ? <a className={styles.clear} href="/planning">{strings.clearAll}</a> : null}
      <button className={styles.apply} type="submit">{strings.apply}</button>
    </form>
  );
}
