import type { ReactNode } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import {
  AdminRecordDrawerProvider,
  type AdminRecordDrawerLabels,
} from "./AdminRecordDrawer";

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
  governance: string;
  reconstruction: string;
};

export default function AdminDestinationFrame({
  current,
  title,
  subtitle,
  hub,
  routeLabel,
  metrics,
  tabs,
  gate,
  governance,
  reconstructionNote,
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
  routeLabel: string;
  metrics: readonly AdminMetric[];
  tabs: readonly AdminTab[];
  gate?: AdminGate;
  governance: readonly string[];
  reconstructionNote: string;
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
            <span className="id-code"><bdi dir="ltr">{routeLabel}</bdi></span>
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

          <nav className="tabs" aria-label={`${title} sections`}>
            {tabs.map(tab => (
              <Link
                className={`tab${tab.current ? " is-active" : ""}`}
                href={tab.href}
                aria-current={tab.current ? "page" : undefined}
                key={`${tab.href}-${tab.label}`}
              >
                {tab.label}
              </Link>
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

          <aside className="row" aria-label={`${title} — ${labels.governance}`}>
            <section className="panel grow">
              <header className="panel-header">
                <h2 className="panel-title">{labels.governance}</h2>
              </header>
              <div className="panel-body stack">
                {governance.map(item => <p key={item}>{item}</p>)}
              </div>
            </section>
            <section className="panel grow">
              <header className="panel-header">
                <h2 className="panel-title">{labels.reconstruction}</h2>
              </header>
              <p className="panel-body">{reconstructionNote}</p>
            </section>
          </aside>
        </div>
      </AdminRecordDrawerProvider>
    </Shell>
  );
}
