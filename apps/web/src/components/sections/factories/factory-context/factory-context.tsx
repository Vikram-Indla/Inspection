import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Button from "@/components/saqeel/button/button";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { type FactoryRow } from "@/features/factories/portfolio";
import styles from "./factory-context.module.css";

export type FactoryContextStrings = {
  readonly selectedContext: string;
  readonly cr: string;
  readonly licence: string;
  readonly plant: string;
  readonly sourceStatus: string;
  readonly aiTitle: string;
  readonly aiWithheld: string;
  readonly aiBody: string;
  readonly aiAction: string;
  readonly missing: string;
};

export default function FactoryContext({ factory, provenance, strings }: {
  factory: FactoryRow;
  provenance: { readonly label: string; readonly tone: StatusTone; readonly body: string; readonly recorded: string };
  strings: FactoryContextStrings;
}) {
  const facts = [
    { label: strings.cr, value: <bdi>{factory.cr_number || strings.missing}</bdi> },
    { label: strings.licence, value: <bdi>{factory.license?.license_number ?? strings.missing}</bdi> },
    { label: strings.plant, value: <bdi>{factory.license?.plant_number ?? strings.missing}</bdi> },
  ];
  return (
    <>
      <Card as="section" labelledBy="factory-context-title">
        <CardHeader
          level="h2"
          titleId="factory-context-title"
          eyebrow={strings.selectedContext}
          title={<span dir="auto">{factory.name}</span>}
        />
        <CardBody>
          <DefinitionList items={facts} />
        </CardBody>
      </Card>

      <Card as="section" labelledBy="factory-source-title">
        <CardHeader level="h2" titleId="factory-source-title" title={strings.sourceStatus} />
        <CardBody gap="tight">
          <StatusPill tone={provenance.tone}>{provenance.label}</StatusPill>
          <p className={styles.body} dir="auto">{provenance.body}</p>
          <p className={styles.recorded} dir="auto">{provenance.recorded}</p>
        </CardBody>
      </Card>

      <Card as="section" labelledBy="factory-ai-title">
        <CardHeader level="h2" titleId="factory-ai-title" title={strings.aiTitle} />
        <CardBody gap="tight">
          <StatusPill tone="info">{strings.aiWithheld}</StatusPill>
          <p className={styles.body}>{strings.aiBody}</p>
          <Button variant="secondary" size="sm" href={factory.dossier_href} label={strings.aiAction}>{strings.aiAction}</Button>
        </CardBody>
      </Card>
    </>
  );
}
