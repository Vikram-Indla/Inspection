import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import { dataOrDash, enumLabel, riskTone, type MyTasksCopy, type VisitEnumCopy } from "@/features/field-my-tasks/labels";
import type { MyTasksDetail as DetailModel } from "@/features/field-my-tasks/queries";
import { fill } from "@/i18n/messages";
import MyTasksRegulatory from "./my-tasks-regulatory";
import MyTasksLocation from "./my-tasks-location";
import styles from "./my-tasks.module.css";

function Pair({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className={styles.pair}>
      <Text role="label" tone="secondary" as="dt">{term}</Text>
      <dd>{children}</dd>
    </div>
  );
}

export default function MyTasksDetail({ detail, copy, enums }: {
  detail: DetailModel;
  copy: MyTasksCopy;
  enums: VisitEnumCopy;
}) {
  return (
    <div className={styles.detail}>
      {detail.hasDossier ? (
        <>
          <Card as="section" labelledBy="my-tasks-establishment">
            <CardHeader
              level="h2"
              titleId="my-tasks-establishment"
              title={copy.establishment.heading}
              description={detail.crTitle || undefined}
              trailing={
                detail.timelineHref ? (
                  <Button href={detail.timelineHref} prefetch={false} variant="secondary" size="sm" icon="elapsed">
                    {copy.establishment.timeline}
                  </Button>
                ) : <StatusPill tone="info" ping={false}>{copy.establishment.licensed}</StatusPill>
              }
            />
            <CardBody>
              <dl className={styles.pairs}>
                <Pair term={copy.establishment.regNumber}>
                  <Mono as="span" >{dataOrDash(copy, detail.registrationNumber)}</Mono>
                </Pair>
                <Pair term={copy.establishment.phone}>
                  <Mono as="span">{copy.noValue}</Mono>
                </Pair>
                <Pair term={copy.establishment.investment}>
                  <Text as="span" dir="auto">{dataOrDash(copy, detail.investment)}</Text>
                </Pair>
                <Pair term={copy.establishment.requestDate}>
                  <Mono as="span">{dataOrDash(copy, detail.requestDate)}</Mono>
                </Pair>
                <Pair term={copy.establishment.estType}>
                  <Text as="span">{copy.establishment.factory}</Text>
                </Pair>
                <Pair term={copy.establishment.estStatus}>
                  {detail.establishmentStatus
                    ? <StatusPill tone="info" ping={false}>{enumLabel(enums, detail.establishmentStatus, detail.establishmentStatus)}</StatusPill>
                    : <Text as="span" tone="muted">{copy.noValue}</Text>}
                </Pair>
              </dl>
            </CardBody>
          </Card>

          <Card as="section" labelledBy="my-tasks-evaluation">
            <CardHeader level="h2" titleId="my-tasks-evaluation" title={copy.evaluation.heading} />
            <CardBody>
              <dl className={styles.pairs}>
                <Pair term={copy.evaluation.complianceRate}>
                  <span className={styles.compliance}>
                    <Mono as="span">
                      {detail.complianceRate === null ? copy.evaluation.notAvailable : `${detail.complianceRate}%`}
                    </Mono>
                    {detail.complianceBasis ? (
                      <Text role="label" tone="muted" as="span">
                        {fill(copy.evaluation.basis, detail.complianceBasis)}
                      </Text>
                    ) : null}
                  </span>
                </Pair>
                <Pair term={copy.evaluation.riskScore}>
                  {detail.riskVisible ? (
                    <StatusPill tone={riskTone(detail.riskBand)}>
                      {detail.riskBand
                        ? `${dataOrDash(copy, detail.riskScore)} · ${enumLabel(enums, detail.riskBand, detail.riskBand)}`
                        : dataOrDash(copy, detail.riskScore)}
                    </StatusPill>
                  ) : (
                    <StatusPill tone="neutral" ping={false}>{copy.evaluation.restricted}</StatusPill>
                  )}
                </Pair>
              </dl>
              <Text role="label" tone="muted">{copy.evaluation.healthRiskNote}</Text>
            </CardBody>
          </Card>

          <Card as="section" labelledBy="my-tasks-license">
            <CardHeader level="h2" titleId="my-tasks-license" title={copy.license.heading} />
            <CardBody>
              <dl className={styles.pairs}>
                <Pair term={copy.license.type}>
                  <Text as="span">{detail.licenseType ? enumLabel(enums, detail.licenseType, detail.licenseType) : copy.noValue}</Text>
                </Pair>
                <Pair term={copy.license.status}>
                  {detail.licenseStatus
                    ? <StatusPill tone="success" ping={false}>{enumLabel(enums, detail.licenseStatus, detail.licenseStatus)}</StatusPill>
                    : <Text as="span" tone="muted">{copy.noValue}</Text>}
                </Pair>
                <Pair term={copy.license.expiryDate}>
                  <Mono as="span">{dataOrDash(copy, detail.licenseExpiry)}</Mono>
                </Pair>
                <Pair term={copy.license.number}>
                  <Mono as="span">{dataOrDash(copy, detail.licenseNumber)}</Mono>
                </Pair>
                <Pair term={copy.license.region}>
                  <Text as="span" dir="auto">{dataOrDash(copy, detail.region)}</Text>
                </Pair>
                <Pair term={copy.license.city}>
                  <Text as="span" dir="auto">{dataOrDash(copy, detail.city)}</Text>
                </Pair>
              </dl>
            </CardBody>
          </Card>

          <MyTasksLocation detail={detail} copy={copy} />
          <MyTasksRegulatory detail={detail} copy={copy} />
        </>
      ) : (
        <Card as="section" labelledBy="my-tasks-no-dossier">
          <CardHeader level="h2" titleId="my-tasks-no-dossier" title={detail.crTitle || copy.title} />
          <CardBody>
            <Text tone="secondary">{copy.detail.noDossier}</Text>
            <dl className={styles.pairs}>
              <Pair term={copy.detail.window}>
                <Mono as="span">{dataOrDash(copy, detail.windowStart)}</Mono>
              </Pair>
              <Pair term={copy.detail.factoryCode}>
                <Text as="span" dir="auto">{dataOrDash(copy, detail.factoryCode)}</Text>
              </Pair>
            </dl>
          </CardBody>
        </Card>
      )}

      <div className={styles.actionBar} role="group" aria-label={copy.actions}>
        <Button href={detail.remoteHref} variant="secondary" block>{copy.start.remote}</Button>
        <Button href={detail.startHref} variant="primary" block>{copy.start.visit}</Button>
      </div>
    </div>
  );
}
