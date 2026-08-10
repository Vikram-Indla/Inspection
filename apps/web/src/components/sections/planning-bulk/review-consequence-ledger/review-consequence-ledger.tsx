import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import type { IconName } from "@/components/saqeel/icon/icon-registry";
import styles from "./review-consequence-ledger.module.css";

export type ConsequenceMark = "ok" | "pending" | "wont" | "blocked";

export type ConsequenceRow = {
  key: string;
  mark: ConsequenceMark;
  value: string;
  detail: string;
};

export type ConsequenceGroup = {
  key: string;
  heading: string;
  rows: readonly ConsequenceRow[];
  negative?: boolean;
  footnote?: string;
};

export type ConsequenceStrings = {
  ledgerH: string;
  ledgerLead: string;
  markOk: string;
  markPending: string;
  markWont: string;
  markBlocked: string;
};

const MARK_ICON: Readonly<Record<ConsequenceMark, IconName>> = {
  ok: "selected",
  pending: "refresh",
  wont: "dismiss",
  blocked: "dismiss",
};

export function ConsequenceGroups({ groups, strings, label }: {
  groups: readonly ConsequenceGroup[];
  strings: ConsequenceStrings;
  label?: string;
}) {
  const markLabel: Readonly<Record<ConsequenceMark, string>> = {
    ok: strings.markOk,
    pending: strings.markPending,
    wont: strings.markWont,
    blocked: strings.markBlocked,
  };

  return (
    <div className={styles.groups} role={label ? "region" : undefined} aria-label={label}>
          {groups.map((group, index) => (
            <section className={styles.group} key={group.key} data-negative={group.negative ? "" : undefined}>
              <h4 className={styles.groupHead}>{`${index + 1} · ${group.heading}`}</h4>
              <ul className={styles.rows}>
                {group.rows.map(row => (
                  <li className={styles.row} key={row.key}>
                    <span className={styles.mark} data-mark={row.mark}>
                      <Icon name={MARK_ICON[row.mark]} size="sm" />
                      <span className="sqx-visually-hidden">{markLabel[row.mark]}</span>
                    </span>
                    <span className={styles.body}>
                      <span className={styles.value}>{row.value}</span>
                      <span className={styles.detail}>{row.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {group.footnote === undefined ? null : (
                <PlanningNotice tone="warning">{group.footnote}</PlanningNotice>
              )}
            </section>
          ))}
    </div>
  );
}

export default function ReviewConsequenceLedger({ groups, strings }: {
  groups: readonly ConsequenceGroup[];
  strings: ConsequenceStrings;
}) {
  return (
    <Card as="section">
      <CardHeader title={strings.ledgerH} description={strings.ledgerLead} />
      <CardBody gap="default">
        <ConsequenceGroups groups={groups} strings={strings} />
      </CardBody>
    </Card>
  );
}
