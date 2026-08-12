import { type ReactNode } from "react";
import RefreshButton from "@/components/planning/header-actions/refresh-button";
import ExportButton, { type ExportButtonStrings } from "@/components/planning/header-actions/export-button";
import SavedViewsMenu, { type SavedViewsStrings } from "@/components/planning/saved-views-menu/saved-views-menu";
import { Heading } from "@/components/saqeel/type";
import type { PlanningListParams } from "@/lib/planning/visit-list";
import styles from "./planning-header.module.css";

export default function PlanningHeader({ title, actionsLabel, refresh, exporting, savedViews, params, canExport, createVisit }: {
  title: string;
  actionsLabel: string;
  refresh: { label: string; busyLabel: string };
  exporting: ExportButtonStrings;
  savedViews: SavedViewsStrings;
  params: PlanningListParams;
  canExport: boolean;
  createVisit: ReactNode;
}) {
  return (
    <header className={styles.root}>
      <Heading level={1}>{title}</Heading>
      <div className={styles.actions} role="group" aria-label={actionsLabel}>
        <RefreshButton label={refresh.label} busyLabel={refresh.busyLabel} />
        {canExport ? <ExportButton params={params} strings={exporting} /> : null}
        <SavedViewsMenu strings={savedViews} />
        {createVisit}
      </div>
    </header>
  );
}
