import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import Icon from "@/components/saqeel/icon/icon";
import styles from "./planning-quick-actions.module.css";

export type PlanningQuickAction = {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly count: number | null;
};

export default function PlanningQuickActions({ actions, strings }: {
  actions: readonly PlanningQuickAction[];
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
                <span className={styles.label}>{action.label}</span>
                {action.count === null
                  ? <span className={styles.unavailable}>{strings.unavailable}</span>
                  : <CountBadge value={action.count} />}
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
