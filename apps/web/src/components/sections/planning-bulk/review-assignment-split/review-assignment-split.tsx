import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import styles from "./review-assignment-split.module.css";

export type AssignmentSplitStrings = {
  assignH: string;
  splitLine: string;
  manualNamed: string;
  manualEvidenceNote: string;
  autoChosen: string;
  autoNote: string;
};

export default function ReviewAssignmentSplit({ manual, auto, strings }: {
  manual: number;
  auto: number;
  strings: AssignmentSplitStrings;
}) {
  const panels: readonly (readonly [string, number, string])[] = [
    [strings.manualNamed, manual, strings.manualEvidenceNote],
    [strings.autoChosen, auto, strings.autoNote],
  ];

  return (
    <Card as="section">
      <CardHeader
        title={strings.assignH}
        description={strings.splitLine.replace("{manual}", String(manual)).replace("{auto}", String(auto))}
      />
      <CardBody gap="tight">
        <div className={styles.panels}>
          {panels.map(([label, value, note]) => (
            <span className={styles.panel} key={label}>
              <span className={styles.label}>{label}</span>
              <span className={styles.value}>{value}</span>
              <span className={styles.note}>{note}</span>
            </span>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
