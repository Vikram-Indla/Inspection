import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { MyTasksCopy } from "@/features/field-my-tasks/labels";
import { REG_CHIPS, type MyTasksDetail, type RegTerm } from "@/features/field-my-tasks/queries";
import { fill } from "@/i18n/messages";
import styles from "./my-tasks.module.css";

export default function MyTasksRegulatory({ detail, copy }: {
  detail: MyTasksDetail;
  copy: MyTasksCopy;
}) {
  const term = (key: RegTerm): string => copy.card[key];
  const sectionName = copy.regulatory[detail.activeReg];

  return (
    <Card as="section" labelledBy="my-tasks-regulatory">
      <CardHeader level="h2" titleId="my-tasks-regulatory" title={copy.regulatory.heading} />
      <CardBody>
        <div className={styles.chips}>
          {REG_CHIPS.map(chip => (
            <Button
              key={chip}
              href={`/field/my-tasks?task=${detail.visitId}&reg=${chip}`}
              prefetch={false}
              variant={detail.activeReg === chip ? "primary" : "secondary"}
              size="sm"
            >
              {copy.regulatory[chip]}
            </Button>
          ))}
        </div>

        {detail.regCards.length === 0 && detail.regHasNoGovernedSource ? (
          <div className={styles.regStack}>
            <StatusPill tone="pending" ping={false}>{copy.regulatory.noSourceTag}</StatusPill>
            <Text tone="secondary">{fill(copy.regulatory.noSource, { section: sectionName })}</Text>
          </div>
        ) : detail.regCards.length === 0 ? (
          <Text tone="muted" live="status">{copy.regulatory.noRecords}</Text>
        ) : (
          <div className={styles.regStack}>
            {detail.regCards.map((card, index) => (
              <div key={`${card.title}-${index}`}>
                <Text role="bodyStrong" dir="auto">
                  {card.titleTerm ? copy.card[card.titleTerm] : card.title || copy.noValue}
                </Text>
                <dl className={styles.pairs}>
                  {card.lines.map(line => (
                    <div key={line.term} className={styles.pair}>
                      <Text role="label" tone="secondary" as="dt">{term(line.term)}</Text>
                      <dd>
                        <Text as="span" dir="auto">{line.value || copy.noValue}</Text>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
