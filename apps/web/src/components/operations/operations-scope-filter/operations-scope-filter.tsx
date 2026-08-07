"use client";

import { useRouter } from "next/navigation";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import styles from "./operations-scope-filter.module.css";

export type ScopeFilterStrings = {
  readonly region: string;
  readonly city: string;
  readonly allRegions: string;
  readonly allCities: string;
};

export default function OperationsScopeFilter({ view, region, city, regions, cities, basePath, strings }: {
  view: "map" | "performance";
  region: string;
  city: string;
  regions: readonly string[];
  cities: readonly string[];
  basePath: string;
  strings: ScopeFilterStrings;
}) {
  const router = useRouter();

  function apply(nextRegion: string, nextCity: string): void {
    const params = new URLSearchParams();
    if (view === "performance") params.set("view", "performance");
    if (nextRegion) params.set("region", nextRegion);
    if (nextCity) params.set("city", nextCity);
    const query = params.toString();
    router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
  }

  const toOptions = (values: readonly string[], allLabel: string): SelectOption[] => [
    { value: "", label: allLabel },
    ...values.map(value => ({ value, label: value })),
  ];

  return (
    <div className={styles.root}>
      <Field label={strings.region}>
        <SaqeelSelect
          options={toOptions(regions, strings.allRegions)}
          value={region}
          onChange={next => apply(next, "")}
          label={strings.region}
        />
      </Field>
      <Field label={strings.city}>
        <SaqeelSelect
          options={toOptions(cities, strings.allCities)}
          value={city}
          onChange={next => apply(region, next)}
          label={strings.city}
          align="end"
        />
      </Field>
    </div>
  );
}
