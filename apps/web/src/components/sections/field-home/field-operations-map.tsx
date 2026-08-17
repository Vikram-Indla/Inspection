import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader, CardMedia } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import {
  enumLabel,
  riskTone,
  type FieldHomeCopy,
  type VisitEnumCopy,
} from "@/features/field-home/labels";
import type { FieldHomeReady } from "@/features/field-home/queries";
import { fill } from "@/i18n/messages";
import FieldMapCanvas from "./field-map-canvas";
import styles from "./field-home.module.css";

function KeyValue({ term, value }: { term: string; value: string }) {
  return (
    <div className={styles.keyValueRow}>
      <Text role="label" tone="secondary" as="dt">{term}</Text>
      <Mono as="dd">{value}</Mono>
    </div>
  );
}

export default function FieldOperationsMap({ body, copy, enums, region }: {
  body: FieldHomeReady;
  copy: FieldHomeCopy;
  enums: VisitEnumCopy;
  region: string | null;
}) {
  const routeTitle = region
    ? fill(copy.map.routeInRegion, { region, route: copy.map.todaysRoute })
    : copy.map.todaysRoute;
  const preview = body.preview;

  return (
    <section aria-labelledby="field-map-heading">
      <div className={styles.sectionHead}>
        <Heading level={2} visual="label" id="field-map-heading">{copy.map.heading}</Heading>
      </div>

      <div className={styles.mapStack}>
        <Card as="article">
          <CardHeader
            level="h3"
            title={routeTitle}
            trailing={<Text role="label" tone="muted" as="span">{copy.map.plannedSequence}</Text>}
          />
          <CardMedia height="sm" label={copy.map.canvasLabel}>
            <FieldMapCanvas
              markers={body.markers}
              centre={body.mapCentre}
              label={copy.map.canvasLabel}
            />
          </CardMedia>
          <CardFooter align="between">
            <div className={styles.legend}>
              {body.routeStops.length > 0 ? body.routeStops.map((stop, index) => (
                <span key={stop.id} className={styles.legendItem}>
                  <span className={styles.stopNumber}><Mono as="span">{index + 1}</Mono></span>
                  <Text role="label" as="span" dir="auto">{stop.factoryName}</Text>
                  <StatusPill tone={riskTone(stop.riskBand)} ping={false}>
                    {enumLabel(enums, stop.riskBand, copy.noValue)}
                  </StatusPill>
                </span>
              )) : (
                <Text role="label" tone="muted" as="span">{copy.map.noStops}</Text>
              )}
            </div>
            <Button href="/field/map" prefetch={false} variant="link" iconEnd="nextPage">
              {copy.map.viewFull}
            </Button>
          </CardFooter>
        </Card>

        {preview ? (
          <Card as="article">
            <CardHeader level="h3" title={copy.preview.heading} description={preview.zone || undefined} />
            <CardBody>
              <div className={styles.previewGrid}>
                <Text role="bodyStrong" dir="auto">{preview.factoryName}</Text>

                {preview.riskScore === null ? null : (
                  <div className={styles.scoreBox}>
                    <Mono as="span">{String(preview.riskScore)}</Mono>
                    <Text role="label" tone="secondary">
                      {preview.riskBand
                        ? `${copy.preview.riskScore} · ${enumLabel(enums, preview.riskBand, copy.noValue)}`
                        : copy.preview.riskScore}
                    </Text>
                  </div>
                )}

                <dl className={styles.keyValues}>
                  <KeyValue term={copy.preview.lastInspection} value={preview.lastInspection ?? copy.noValue} />
                  <KeyValue
                    term={copy.preview.openViolations}
                    value={preview.openViolations === null ? copy.noValue : String(preview.openViolations)}
                  />
                  <KeyValue term={copy.preview.visitType} value={enumLabel(enums, preview.visitType, copy.noValue)} />
                  <KeyValue term={copy.preview.scheduled} value={`${preview.scheduledDate} · ${preview.scheduledTime}`} />
                </dl>

                {body.focusNote ? (
                  <div className={styles.focusNote}>
                    <Icon name="ai" size="sm" />
                    <Text role="label" tone="secondary" as="span" dir="auto">{body.focusNote}</Text>
                  </div>
                ) : null}

                <div className={styles.actions}>
                  <Button href={preview.journeyHref} prefetch={false} variant="primary" block>
                    {copy.reco.start}
                  </Button>
                  <Button href={preview.prepHref} prefetch={false} variant="secondary" block>
                    {copy.preview.openPrep}
                  </Button>
                  <Button href={preview.factory360Href} prefetch={false} variant="secondary" block>
                    {copy.preview.openF360}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card as="article">
            <CardBody>
              <Text tone="muted" live="status" align="center">{copy.preview.empty}</Text>
            </CardBody>
          </Card>
        )}
      </div>
    </section>
  );
}
