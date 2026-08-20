/* @retiring 2026-08-16 · replaced-by components/app-shell/shell-page-frame/shell-page-frame · pending /admin/integrations,/admin/localization,/admin/packages,/admin/risk · delete-when 0-imports */
import type { ReactNode } from "react";
import Button from "@/components/saqeel/button/button";
import Shell from "@/components/Shell";
import {
  AdminRecordDrawerProvider,
  type AdminRecordDrawerLabels,
} from "./AdminRecordDrawer";
import styles from "./admin-destination-frame.module.css";

export type AdminMetric = {
  label: string;
  value: string | number;
  note: string;
};

export type AdminTab = {
  label: string;
  href: string;
  current?: boolean;
};

export type AdminGate = {
  title: string;
  body: string;
};

export type AdminFrameLabels = {
  administration: string;
  breadcrumb: string;
};

export default function AdminDestinationFrame({
  current,
  title,
  subtitle,
  hub,
  metrics,
  tabs,
  gate,
  labels,
  children,
  context,
  designId,
  drawerLabels,
}: {
  current: string;
  title: string;
  subtitle: string;
  hub: string;
  metrics: readonly AdminMetric[];
  tabs: readonly AdminTab[];
  gate?: AdminGate;
  labels: AdminFrameLabels;
  children: ReactNode;
  context?: ReactNode;
  designId: string;
  drawerLabels: AdminRecordDrawerLabels;
}) {
  return (
    <Shell current={current} title="" context={context}>
      <AdminRecordDrawerProvider labels={drawerLabels}>
        <div className="stack" data-saqeel-admin-destination={designId}>
          <header className="page-header">
            <div className="stack">
              <nav className="breadcrumb" aria-label={labels.breadcrumb}>
                <span>{labels.administration}</span>
                <span className="sep" aria-hidden="true">/</span>
                <span>{hub}</span>
              </nav>
              <div>
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>
            </div>
          </header>

          <section className="metric-strip" aria-label={`${title} governance figures`}>
            {metrics.map(metric => (
              <article key={metric.label}>
                <span className="kpi-label">{metric.label}</span>
                <strong className="kpi-value">{metric.value}</strong>
                <span className="kpi-delta">{metric.note}</span>
              </article>
            ))}
          </section>

          <nav className={styles.tabs} aria-label={`${title} sections`}>
            {tabs.map(tab => (
              <Button
                key={`${tab.href}-${tab.label}`}
                href={tab.href}
                variant={tab.current ? "primary" : "secondary"}
                size="sm"
              >
                {tab.label}
              </Button>
            ))}
          </nav>

          {gate ? (
            <section className="alert alert-immutable" aria-label={gate.title}>
              <div>
                <strong className="alert-title">{gate.title}</strong>
                <p>{gate.body}</p>
              </div>
            </section>
          ) : null}

          {children}
        </div>
      </AdminRecordDrawerProvider>
    </Shell>
  );
}
