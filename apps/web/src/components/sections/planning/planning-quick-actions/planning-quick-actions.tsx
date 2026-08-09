import Link from "next/link";
import { type ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import Icon from "@/components/saqeel/icon/icon";
import type { IconName } from "@/components/saqeel/icon/icon-registry";
import styles from "./planning-quick-actions.module.css";

export type PlanningQuickActionCount = number | "unavailable";

export type PlanningQuickAction = {
  readonly key: string;
  readonly label: string;
  readonly icon: IconName;
  readonly href: string;
  readonly count?: PlanningQuickActionCount;
};

export default function PlanningQuickActions({ actions, createMenu, strings }: {
  actions: readonly PlanningQuickAction[];
  createMenu: ReactNode;
  strings: { readonly title: string; readonly unavailable: string };
}) {
  return (
    <Card as="section" labelledBy="planning-quick-actions-heading">
      <CardHeader
        level="h2"
        titleId="planning-quick-actions-heading"
        title={<span className={styles.heading}><Icon name="workflow" size="sm" />{strings.title}</span>}
      />
      <CardBody gap="tight">
        <ul className={styles.list}>
          {actions.map(action => (
            <li key={action.key}>
              <Link className={styles.action} href={action.href} prefetch={false}>
                <Icon name={action.icon} size="sm" />
                <span className={styles.label}>{action.label}</span>
                {action.count === undefined ? null : action.count === "unavailable"
                  ? <span className={styles.unavailable}>{strings.unavailable}</span>
                  : <CountBadge value={action.count} />}
              </Link>
            </li>
          ))}
          <li>{createMenu}</li>
        </ul>
      </CardBody>
    </Card>
  );
}
