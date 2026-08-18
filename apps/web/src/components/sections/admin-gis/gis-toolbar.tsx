"use client";

import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import type { AdminGisMessages } from "@/features/admin-gis/strings";
import { fill } from "@/i18n/messages";
import styles from "./gis.module.css";

export default function GisToolbar({ strings, query, region, band, regions, shown, total, unlocated, onQuery, onRegion, onBand }: {
  strings: AdminGisMessages;
  query: string;
  region: string;
  band: string;
  regions: readonly string[];
  shown: number;
  total: number;
  unlocated: number;
  onQuery: (value: string) => void;
  onRegion: (value: string) => void;
  onBand: (value: string) => void;
}) {
  const t = strings.toolbar;

  return (
    <div className={styles.toolbarGroup}>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <TextInput type="search" value={query} onChange={onQuery} label={t.searchLabel} placeholder={t.searchPlaceholder} />
        </div>
        <div className={styles.filter}>
          <SaqeelSelect
            label={t.regionLabel}
            value={region}
            onChange={onRegion}
            options={[{ value: "", label: t.regionAll }, ...regions.map(name => ({ value: name, label: name }))]}
          />
        </div>
        <div className={styles.filter}>
          <SaqeelSelect
            label={t.bandLabel}
            value={band}
            onChange={onBand}
            options={[
              { value: "", label: t.bandAll },
              { value: "high", label: strings.band.high },
              { value: "medium", label: strings.band.medium },
              { value: "low", label: strings.band.low },
              { value: "unbanded", label: strings.band.unbanded },
            ]}
          />
        </div>
      </div>
      <Text role="label" tone="muted">
        {`${fill(t.shownOf, { shown, total })}${unlocated > 0 ? ` · ${fill(t.noCoords, { count: unlocated })}` : ""}`}
      </Text>
    </div>
  );
}
