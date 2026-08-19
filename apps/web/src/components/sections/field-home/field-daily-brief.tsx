"use client";

import { useFieldScope } from "@/components/field/FieldScopeProvider";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import { riskBandLabel, riskTone, type FieldHomeCopy } from "@/features/field-home/labels";
import type { FieldBriefText, FieldRecommendation } from "@/features/field-home/queries";
import styles from "./field-home.module.css";

function toProse(text: string): string {
  return text
    .split("\n")
    .map(line => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .join(" ");
}

export default function FieldDailyBrief({ daily, weekly, recommendation, copy }: {
  daily: FieldBriefText;
  weekly: FieldBriefText;
  recommendation: FieldRecommendation | null;
  copy: FieldHomeCopy;
}) {
  const { scope } = useFieldScope();
  const active = scope === "weekly" ? weekly : daily;
  const prose = active.text ? toProse(active.text) : "";
  const bandLabel = recommendation ? riskBandLabel(copy, recommendation.riskBand) : null;

  return (
    <Card as="section" accent="ai" labelledBy="field-brief-heading">
      <CardHeader
        level="h2"
        titleId="field-brief-heading"
        title={copy.brief.heading}
        trailing={<StatusPill tone="info" ping={false}>{copy.brief.advisory}</StatusPill>}
      />
      <CardBody>
        {prose ? (
          <Text tone="secondary" dir="auto">{prose}</Text>
        ) : (
          <Text tone="muted" live="status">{active.error ?? copy.brief.unavailable}</Text>
        )}

        {recommendation ? (
          <div className={styles.reco}>
            <div className={styles.recoBody}>
              <Heading level={3} visual="label">{copy.reco.heading}</Heading>
              <div className={styles.recoName}>
                <Text role="bodyStrong" as="span" dir="auto">{recommendation.factoryName}</Text>
                {bandLabel ? (
                  <StatusPill tone={riskTone(recommendation.riskBand)}>{bandLabel}</StatusPill>
                ) : null}
              </div>
              <div className={styles.reason}>
                <Icon name="ai" size="sm" />
                <Text role="label" tone="secondary" as="span">
                  {recommendation.isHighestRisk ? copy.reco.highRisk : copy.reco.soonest}
                </Text>
              </div>
            </div>
            <div className={styles.actions}>
              <Button href={recommendation.factoryHref} prefetch={false} variant="secondary">
                {copy.reco.viewCard}
              </Button>
              <Button href={recommendation.startHref} prefetch={false} variant="primary">
                {copy.reco.start}
              </Button>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
