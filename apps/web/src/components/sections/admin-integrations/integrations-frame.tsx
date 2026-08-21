import { type ReactNode } from "react";
import Button from "@/components/saqeel/button/button";
import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Metric, Overline, Text } from "@/components/saqeel/type";
import type { AdminIntegrationsMessages } from "@/features/admin-integrations/strings";
import styles from "./integrations.module.css";

export type FrameMetric = {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly note: string;
};

export type FrameTab = {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly current?: boolean;
};

export default function IntegrationsFrame({ strings, metrics, tabs, children }: {
  strings: AdminIntegrationsMessages;
  metrics: readonly FrameMetric[];
  tabs: readonly FrameTab[];
  children: ReactNode;
}) {
  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.hub },
      ]}
      description={strings.subtitle}
      title={strings.title}
    >
      <div className={styles.metrics}>
        {metrics.map(metric => (
          <div className={styles.metric} key={metric.key}>
            <Overline tone="secondary">{metric.label}</Overline>
            <Metric>{metric.value}</Metric>
            <Text role="label" tone="muted">{metric.note}</Text>
          </div>
        ))}
      </div>

      <nav className={styles.tabs} aria-label={strings.tabs.label}>
        {tabs.map(tab => (
          <Button
            key={tab.key}
            href={tab.href}
            variant="link"
            size="sm"
            iconEnd={tab.current ? undefined : "externalLink"}
          >
            {tab.label}
          </Button>
        ))}
      </nav>

      {children}
    </ShellPageFrame>
  );
}
