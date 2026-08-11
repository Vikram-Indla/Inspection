import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";

export type FactoryIdentityStrings = {
  readonly heading: string;
  readonly syncedLabel: string;
};

export default function FactoryIdentity({ code, contextLine, facts, provenance, synced, strings }: {
  code: string;
  contextLine: string;
  facts: readonly Definition[];
  provenance: { readonly label: string; readonly tone: StatusTone };
  synced: string;
  strings: FactoryIdentityStrings;
}) {
  return (
    <>
      <Card as="section" labelledBy="factory-identity-title">
        <CardHeader
          level="h2"
          titleId="factory-identity-title"
          title={strings.heading}
          description={<bdi>{code}</bdi>}
        />
        <CardBody gap="tight">
          <DefinitionList items={facts} />
          {contextLine ? <Text tone="muted" dir="auto">{contextLine}</Text> : null}
        </CardBody>
      </Card>

      <Card as="div">
        <CardBody gap="tight">
          <StatusPill tone={provenance.tone}>{provenance.label}</StatusPill>
          <Text tone="muted">{strings.syncedLabel} <bdi>{synced}</bdi></Text>
        </CardBody>
      </Card>
    </>
  );
}
