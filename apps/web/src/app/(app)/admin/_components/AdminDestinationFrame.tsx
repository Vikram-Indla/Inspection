import type { ReactNode } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import styles from "./AdminDestinationFrame.module.css";

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
}) {
  return (
    <Shell current={current} title="" context={context}>
      <div className={styles.workspace} data-saqeel-admin-destination={designId}>
        <div className={styles.main}>
          <header className={styles.heading}>
            <div>
              <nav className={styles.breadcrumb} aria-label={labels.breadcrumb}>
                <ol>
                  <li>{labels.administration}</li>
                  <li>{hub}</li>
                </ol>
              </nav>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.subtitle}>{subtitle}</p>
            </div>
            <span className="sq-version"><bdi dir="ltr">{routeLabel}</bdi></span>
          </header>

          <section className={styles.metrics} aria-label={`${title} governance figures`}>
            {metrics.map(metric => (
              <article className={styles.metric} key={metric.label}>
                <span className={styles.metricLabel}>{metric.label}</span>
                <strong className={styles.metricValue}>{metric.value}</strong>
                <span className={styles.metricNote}>{metric.note}</span>
              </article>
            ))}
          </section>

          <nav className={styles.tabs} aria-label={`${title} sections`}>
            {tabs.map(tab => (
              <Link
                className={styles.tab}
                href={tab.href}
                aria-current={tab.current ? "page" : undefined}
                key={`${tab.href}-${tab.label}`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {gate ? (
            <section className={styles.gate} aria-label={gate.title}>
              <strong>{gate.title}</strong>
              <p>{gate.body}</p>
            </section>
          ) : null}

          {children}
        </div>

        <aside className={styles.rail} aria-label={`${title} — ${labels.governance}`}>
          <section className={styles.railCard}>
            <h2 className={styles.railTitle}>{labels.governance}</h2>
            <ul className={styles.governance}>
              {governance.map(item => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section className={styles.railCard}>
            <h2 className={styles.railTitle}>{labels.reconstruction}</h2>
            <p className={styles.note}>{reconstructionNote}</p>
          </section>
        </aside>
      </div>
    </Shell>
  );
}
