import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import { Text } from "@/components/saqeel/type";
import { VISIT_ALLOWED_TONE, type VisitBoardRow } from "@/features/visits/rows";
import type { VisitsBoardStrings } from "@/features/visits/board-strings";
import styles from "./visit-board.module.css";

export default function VisitSpine({ visit, strings }: {
  visit: VisitBoardRow | null;
  strings: VisitsBoardStrings;
}) {
  return (
    <Card as="section" labelledBy="visit-spine-heading">
      <CardHeader
        level="h2"
        titleId="visit-spine-heading"
        title={strings.spineHeading}
        trailing={visit ? (
          <StatusPill tone={VISIT_ALLOWED_TONE[visit.allowedKey]}>{strings.allowed[visit.allowedKey]}</StatusPill>
        ) : undefined}
      />
      <CardBody gap="tight">
        {visit ? (
          <div className={styles.spine}>
            <DefinitionList
              columns="two"
              items={[
                { label: strings.colVisit, value: <bdi>{visit.reference}</bdi> },
                { label: strings.colFactory, value: visit.factoryName },
                { label: strings.colTypeMode, value: `${visit.typeLabel} · ${visit.modeLabel}` },
                { label: strings.colPlanning, value: <StatusPill tone={visit.planningTone}>{visit.planningLabel}</StatusPill> },
                { label: strings.colOperational, value: <StatusPill tone={visit.operationalTone}>{visit.operationalLabel}</StatusPill> },
                { label: strings.spineWindow, value: `${visit.windowStart} — ${visit.windowEnd}` },
                { label: strings.spineInspector, value: visit.inspectorName },
              ]}
            />
            <Button variant="secondary" href={visit.href}>{strings.spineOpenDetail}</Button>
          </div>
        ) : (
          <Text tone="muted">{strings.spineEmpty}</Text>
        )}
      </CardBody>
    </Card>
  );
}
