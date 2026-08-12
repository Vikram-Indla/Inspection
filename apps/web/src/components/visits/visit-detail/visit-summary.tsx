import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import Timeline from "@/components/saqeel/timeline/timeline";
import { Text } from "@/components/saqeel/type";
import type { TimedEntry } from "@/features/visits/detail/view";
import styles from "./visit-detail.module.css";

export type GovernedNotice = {
  readonly id: string;
  readonly text: string;
  readonly tone: "warning" | "danger" | "muted";
};

export default function VisitSummary({
  configTitle,
  configItems,
  factoryHref,
  factoryLabel,
  provenance,
  inspectionTitle,
  inspectionItems,
  inspectionEmpty,
  reportHref,
  reportLabel,
  planTitle,
  planItems,
  planHref,
  planLabel,
  planEmpty,
  packagesTitle,
  packagesEmpty,
  packageEntries,
  notices,
}: {
  configTitle: string;
  configItems: readonly Definition[];
  factoryHref: string | null;
  factoryLabel: string;
  provenance: string | null;
  inspectionTitle: string;
  inspectionItems: readonly Definition[];
  inspectionEmpty: string;
  reportHref: string | null;
  reportLabel: string;
  planTitle: string;
  planItems: readonly Definition[];
  planHref: string | null;
  planLabel: string;
  planEmpty: string;
  packagesTitle: string;
  packagesEmpty: string;
  packageEntries: readonly TimedEntry[];
  notices: readonly GovernedNotice[];
}) {
  return (
    <>
      {notices.map(notice => (
        <Text
          key={notice.id}
          as="p"
          role="label"
          tone={notice.tone === "muted" ? "secondary" : notice.tone}
          live={notice.tone === "danger" ? "alert" : "status"}
        >
          {notice.text}
        </Text>
      ))}

      <div className={styles.split}>
        <Card as="section" labelledBy="config">
          <CardHeader level="h2" titleId="config" title={configTitle} />
          <CardBody gap="tight">
            <DefinitionList items={configItems} />
            {provenance ? <Text as="p" role="label" tone="muted">{provenance}</Text> : null}
            {factoryHref ? (
              <Button variant="tertiary" size="sm" href={factoryHref} label={factoryLabel}>{factoryLabel}</Button>
            ) : null}
          </CardBody>
        </Card>

        <Card as="section" labelledBy="inspection">
          <CardHeader level="h2" titleId="inspection" title={inspectionTitle} />
          <CardBody gap="tight">
            {inspectionItems.length
              ? <DefinitionList items={inspectionItems} />
              : <Text as="p" role="label" tone="muted">{inspectionEmpty}</Text>}
            {reportHref ? (
              <Button variant="tertiary" size="sm" href={reportHref} label={reportLabel}>{reportLabel}</Button>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card as="section" labelledBy="plan">
        <CardHeader level="h2" titleId="plan" title={planTitle} />
        <CardBody gap="tight">
          {planItems.length
            ? <DefinitionList items={planItems} columns="two" />
            : <Text as="p" role="label" tone="muted">{planEmpty}</Text>}
          {planHref ? (
            <Button variant="tertiary" size="sm" href={planHref} label={planLabel}>{planLabel}</Button>
          ) : null}
        </CardBody>
      </Card>

      <Card as="section" labelledBy="packages">
        <CardHeader level="h2" titleId="packages" title={packagesTitle} />
        <CardBody>
          {packageEntries.length
            ? (
              <Timeline
                labelledBy="packages"
                events={packageEntries.map(entry => ({
                  id: entry.id,
                  dateTime: entry.dateTime,
                  time: entry.time,
                  title: entry.title,
                  meta: entry.meta ?? undefined,
                  detail: entry.detail ?? undefined,
                }))}
              />
            )
            : <Text as="p" role="label" tone="muted">{packagesEmpty}</Text>}
        </CardBody>
      </Card>
    </>
  );
}
