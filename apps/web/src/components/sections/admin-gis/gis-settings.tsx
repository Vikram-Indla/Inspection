import { Card, CardBody } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import { Text } from "@/components/saqeel/type";
import type { AdminGisMessages } from "@/features/admin-gis/strings";
import type { GisSettings as GisSettingsData } from "@/features/admin-gis/types";
import styles from "./gis.module.css";

type SettingRow = { readonly key: string; readonly label: string; readonly value: string };

export default function GisSettings({ strings, settings }: {
  strings: AdminGisMessages;
  settings: GisSettingsData;
}) {
  const s = strings.settings;
  const rows: readonly SettingRow[] = [
    { key: "gps", label: s.gps, value: `≤ ${String(settings.gps_accuracy_checkin_max_m ?? strings.dash)} m` },
    { key: "arrival", label: s.arrival, value: `${String(settings.arrival_detection_radius_m ?? strings.dash)} m` },
    { key: "fence", label: s.fence, value: `${String(settings.geofence_default_radius_m ?? strings.dash)} m (${s.fenceNote})` },
    { key: "telemetry", label: s.telemetry, value: `${String(settings.telemetry_interval_s ?? strings.dash)} s` },
    { key: "deviation", label: s.deviation, value: JSON.stringify(settings.route_deviation ?? null) },
    { key: "retention", label: s.retention, value: JSON.stringify(settings.retention ?? null) },
  ];

  const columns: readonly DataColumn<SettingRow>[] = [
    { key: "setting", header: s.setting, isRowHeader: true, cell: row => <Text as="span" role="bodyStrong">{row.label}</Text> },
    { key: "value", header: s.value, cell: row => <Text as="span" role="mono" dir="ltr">{row.value}</Text> },
  ];

  return (
    <Card as="section">
      <CardBody>
        <div className={styles.tableFit}>
          <DataTable columns={columns} rows={rows} getRowId={row => row.key} empty={{ icon: "map", title: s.setting }} bleed={false} />
        </div>
      </CardBody>
    </Card>
  );
}
