import Link from "next/link";
import { type ReactNode } from "react";
import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Metric, Overline, Text } from "@/components/saqeel/type";
import type { AdminAccessMessages } from "@/features/admin-access/strings";
import styles from "./access-frame.module.css";

export type FrameMetric = {
  readonly key: string;
  readonly label: string;
  readonly value: string;
};

export type FrameTab = {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly current?: boolean;
};

export default function AccessFrame({ strings, metrics, tabs, actions, children }: {
  strings: AdminAccessMessages;
  metrics?: readonly FrameMetric[];
  tabs?: readonly FrameTab[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.hub },
      ]}
      title={strings.title}
      actions={actions}
    >
      {metrics?.length ? (
        <div className={styles.metrics}>
          {metrics.map(metric => (
            <div className={styles.metric} key={metric.key}>
              <Overline tone="secondary">{metric.label}</Overline>
              <Metric>{metric.value}</Metric>
            </div>
          ))}
        </div>
      ) : null}

      {tabs?.length ? (
        <nav aria-label={strings.tabs.label}>
          <ul className={styles.tabs}>
            {tabs.map(tab => (
              <li key={tab.key}>
                <Link
                  aria-current={tab.current ? "page" : undefined}
                  className={styles.tab}
                  href={tab.href}
                  prefetch={false}
                >
                  <Text as="span" role="bodyStrong" tone="inherit">{tab.label}</Text>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {children}
    </ShellPageFrame>
  );
}
