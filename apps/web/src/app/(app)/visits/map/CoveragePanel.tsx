"use client";

import { useMemo, useState } from "react";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Field from "@/components/saqeel/field/field";
import { ListRow, ListRows } from "@/components/saqeel/list-row/list-row";
import SaqeelSelect from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import type { MappedVisit } from "./VisitMap";
import { filterVisits, regionalCoverage } from "./coverage-filters";
import styles from "./coverage-panel.module.css";

export type CoveragePanelStrings = {
  title: string;
  filtersTitle: string;
  regionLabel: string; allRegions: string;
  riskLabel: string; allRisk: string;
  windowLabel: string; window7: string; window30: string; window90: string; windowAll: string;
  inspectorLabel: string; inspectorAll: string; inspectorAssigned: string; inspectorUnassigned: string;
  reset: string;
  unassignedCount: string; unassignedEmpty: string;
  regionalTitle: string; regionalHelp: string; visitsCount: string;
  riskUnavailable: string;
};

const DEFAULT_WINDOW_DAYS = 30;

export default function CoveragePanel({ visits, riskOptions, strings: s }: {
  visits: MappedVisit[];
  riskOptions: readonly { readonly value: string; readonly label: string }[];
  strings: CoveragePanelStrings;
}) {
  const regions = useMemo(() => [...new Set(visits.map(v => v.region).filter(Boolean))].sort(), [visits]);
  const [region, setRegion] = useState("");
  const [risk, setRisk] = useState("");
  const [windowDays, setWindowDays] = useState<number | null>(DEFAULT_WINDOW_DAYS);
  const [inspectorFilter, setInspectorFilter] = useState<"" | "assigned" | "unassigned">("");

  const filtered = useMemo(
    () => filterVisits(visits, { region, risk, windowDays, inspectorFilter }, Date.now()),
    [visits, region, risk, windowDays, inspectorFilter],
  );
  const unassigned = useMemo(() => filtered.filter(v => !v.inspectorName), [filtered]);
  const regionalCounts = useMemo(() => regionalCoverage(filtered), [filtered]);

  const reset = () => {
    setRegion("");
    setRisk("");
    setWindowDays(DEFAULT_WINDOW_DAYS);
    setInspectorFilter("");
  };

  return (
    <section className={styles.root} aria-label={s.title}>
      <div className={styles.column}>
        <Card as="section">
          <CardHeader title={s.filtersTitle} />
          <CardBody gap="tight">
            <Field label={s.regionLabel}>
              <SaqeelSelect
                label={s.regionLabel} value={region} onChange={setRegion}
                options={[{ value: "", label: s.allRegions }, ...regions.map(name => ({ value: name, label: name }))]}
              />
            </Field>
            <Field label={s.riskLabel}>
              <SaqeelSelect
                label={s.riskLabel} value={risk} onChange={setRisk}
                options={[{ value: "", label: s.allRisk }, ...riskOptions]}
              />
            </Field>
            <Field label={s.windowLabel}>
              <SaqeelSelect
                label={s.windowLabel}
                value={windowDays === null ? "" : String(windowDays)}
                onChange={next => setWindowDays(next === "" ? null : Number(next))}
                options={[
                  { value: "7", label: s.window7 },
                  { value: "30", label: s.window30 },
                  { value: "90", label: s.window90 },
                  { value: "", label: s.windowAll },
                ]}
              />
            </Field>
            <Field label={s.inspectorLabel}>
              <SaqeelSelect
                label={s.inspectorLabel}
                value={inspectorFilter}
                onChange={next => setInspectorFilter(next === "assigned" || next === "unassigned" ? next : "")}
                options={[
                  { value: "", label: s.inspectorAll },
                  { value: "assigned", label: s.inspectorAssigned },
                  { value: "unassigned", label: s.inspectorUnassigned },
                ]}
              />
            </Field>
            <Button variant="secondary" size="sm" onClick={reset}>{s.reset}</Button>
          </CardBody>
        </Card>

        <Card as="section">
          <CardHeader title={fill(s.unassignedCount, { n: unassigned.length })} />
          <CardBody gap="tight">
            {unassigned.length === 0
              ? <EmptyState icon="factory" title={s.unassignedEmpty} size="sm" />
              : (
                <ListRows label={fill(s.unassignedCount, { n: unassigned.length })}>
                  {unassigned.map(visit => (
                    <ListRow
                      key={visit.id}
                      href={`/factories/${visit.factoryId}`}
                      title={<Text as="span" dir="auto">{visit.factoryName}</Text>}
                      meta={<Text as="span" tone="muted" dir="auto">{visit.region}</Text>}
                      trailing={<StatusPill tone="neutral" ping={false}>{visit.riskBand ?? s.riskUnavailable}</StatusPill>}
                    />
                  ))}
                </ListRows>
              )}
          </CardBody>
        </Card>
      </div>

      <Card as="section">
        <CardHeader title={s.regionalTitle} description={s.regionalHelp} />
        <CardBody gap="tight">
          {regionalCounts.length === 0
            ? <EmptyState icon="map" title={s.unassignedEmpty} size="sm" />
            : (
              <ListRows label={s.regionalTitle}>
                {regionalCounts.map(([name, count]) => (
                  <ListRow
                    key={name}
                    title={<Text as="span" dir="auto">{name}</Text>}
                    trailing={<Mono>{fill(s.visitsCount, { n: count })}</Mono>}
                  />
                ))}
              </ListRows>
            )}
        </CardBody>
      </Card>
    </section>
  );
}
