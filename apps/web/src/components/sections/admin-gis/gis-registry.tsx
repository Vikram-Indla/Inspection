"use client";

import { Card, CardBody } from "@/components/saqeel/card/card";
import DataTable, { CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { bandLabel, bandTone, type AdminGisMessages } from "@/features/admin-gis/strings";
import type { GisFactory } from "@/features/admin-gis/types";
import styles from "./gis.module.css";

export default function GisRegistry({ strings, factories, selectedId, defaultFence, onSelect }: {
  strings: AdminGisMessages;
  factories: readonly GisFactory[];
  selectedId: string | null;
  defaultFence: number;
  onSelect: (id: string) => void;
}) {
  const r = strings.registry;
  const mono = (value: React.ReactNode) => <Text as="span" role="mono" dir="ltr">{value}</Text>;

  const columns: readonly DataColumn<GisFactory>[] = [
    { key: "code", header: r.code, cell: factory => mono(factory.factory_code) },
    {
      key: "name",
      header: r.name,
      isRowHeader: true,
      cell: factory => factory.official_lat != null && factory.official_lng != null
        ? <Button variant="link" size="sm" onClick={() => onSelect(factory.id)}>{factory.name}</Button>
        : <Text as="span" role="bodyStrong">{factory.name}</Text>,
    },
    { key: "region", header: r.region, cell: factory => <Text as="span">{factory.region ?? strings.dash}</Text> },
    { key: "city", header: r.city, cell: factory => <Text as="span">{factory.city ?? strings.dash}</Text> },
    { key: "band", header: r.band, cell: factory => <StatusPill tone={bandTone(factory.risk_band)}>{bandLabel(factory.risk_band, strings)}</StatusPill> },
    {
      key: "radius",
      header: r.radius,
      cell: factory => (
        <span className={styles.cellStack}>
          {mono(`${factory.geofence_radius_m ?? defaultFence} m`)}
          {factory.geofence_radius_m == null ? <Text as="span" role="label" tone="secondary">{r.radiusDefault}</Text> : null}
        </span>
      ),
    },
    {
      key: "coords",
      header: r.coords,
      cell: factory => factory.official_lat != null && factory.official_lng != null
        ? mono(`${factory.official_lat}, ${factory.official_lng}`)
        : <CellMuted>{strings.dash}</CellMuted>,
    },
  ];

  return (
    <Card as="section">
      <CardBody>
        <DataTable
          columns={columns}
          rows={factories}
          getRowId={factory => factory.id}
          getRowSelected={factory => factory.id === selectedId}
          empty={{ icon: "map", title: strings.toolbar.noResults }}
        />
      </CardBody>
    </Card>
  );
}
