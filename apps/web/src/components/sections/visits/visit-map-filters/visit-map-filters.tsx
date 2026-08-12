"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import Toolbar from "@/components/saqeel/toolbar/toolbar";
import { mapHref, type VisitMapFilter } from "@/features/visits/map";
import styles from "./visit-map-filters.module.css";

export type VisitMapFilterStrings = {
  readonly filtersTitle: string;
  readonly regionLabel: string;
  readonly allRegions: string;
  readonly riskLabel: string;
  readonly allRisk: string;
  readonly windowLabel: string;
  readonly window7: string;
  readonly window30: string;
  readonly window90: string;
  readonly windowAll: string;
  readonly reset: string;
};

const CLEARED: VisitMapFilter = { region: "", risk: "", windowDays: null };

export default function VisitMapFilters({ filter, regions, riskOptions, basePath, strings }: {
  filter: VisitMapFilter;
  regions: readonly string[];
  riskOptions: readonly { readonly value: string; readonly label: string }[];
  basePath: string;
  strings: VisitMapFilterStrings;
}) {
  const router = useRouter();
  const apply = (next: VisitMapFilter) => router.push(mapHref(basePath, next, 0));
  const isCleared = filter.region === "" && filter.risk === "" && filter.windowDays === null;

  return (
    <Toolbar
      as="header"
      label={strings.filtersTitle}
      trailing={
        <Button variant="tertiary" size="sm" href={isCleared ? undefined : mapHref(basePath, CLEARED, 0)} disabled={isCleared}>
          {strings.reset}
        </Button>
      }
    >
      <div className={styles.field}>
        <Field label={strings.regionLabel}>
          <SaqeelSelect
            label={strings.regionLabel}
            value={filter.region}
            onChange={region => apply({ ...filter, region })}
            options={[{ value: "", label: strings.allRegions }, ...regions.map(name => ({ value: name, label: name }))]}
          />
        </Field>
      </div>
      <div className={styles.field}>
        <Field label={strings.riskLabel}>
          <SaqeelSelect
            label={strings.riskLabel}
            value={filter.risk}
            onChange={risk => apply({ ...filter, risk })}
            options={[{ value: "", label: strings.allRisk }, ...riskOptions]}
          />
        </Field>
      </div>
      <div className={styles.field}>
        <Field label={strings.windowLabel}>
          <SaqeelSelect
            label={strings.windowLabel}
            value={filter.windowDays === null ? "" : String(filter.windowDays)}
            onChange={next => apply({ ...filter, windowDays: next === "" ? null : Number(next) })}
            options={[
              { value: "", label: strings.windowAll },
              { value: "7", label: strings.window7 },
              { value: "30", label: strings.window30 },
              { value: "90", label: strings.window90 },
            ]}
          />
        </Field>
      </div>
    </Toolbar>
  );
}
