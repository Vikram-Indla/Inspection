import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { PlanningRecommendationReason } from "@/features/planning/assistant";
import type { PlanningRecommendationView } from "@/features/planning/assistant-view";
import styles from "./planning-recommendations.module.css";

export type PlanningRecommendationStrings = {
  readonly title: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly plan: string;
  readonly review: string;
  readonly riskScore: string;
  readonly scoreUnavailable: string;
  readonly bandUnavailable: string;
  readonly reason: Record<PlanningRecommendationReason, string>;
};

export default function PlanningRecommendations({ recommendations, strings }: {
  recommendations: readonly PlanningRecommendationView[];
  strings: PlanningRecommendationStrings;
}) {
  return (
    <Card as="section" accent="ai" labelledBy="planning-recommendations-heading">
      <CardHeader
        level="h2"
        titleId="planning-recommendations-heading"
        title={<span className={styles.heading}><Icon name="ai" size="sm" />{strings.title}</span>}
      />
      <CardBody>
        {recommendations.length === 0 ? (
          <EmptyState icon="risk" size="sm" title={strings.emptyTitle} description={strings.emptyBody} />
        ) : (
          <ul className={styles.list}>
            {recommendations.map(item => (
              <li key={item.factoryId} className={styles.item}>
                <div className={styles.head}>
                  <span className={styles.name} dir="auto">{item.factoryName}</span>
                  <span className={styles.score}>
                    {strings.riskScore}{" "}
                    <strong>{item.riskScore === null ? strings.scoreUnavailable : item.riskScore}</strong>
                  </span>
                </div>
                <div className={styles.tags}>
                  <StatusPill tone={item.riskTone}>{item.riskBandLabel ?? strings.bandUnavailable}</StatusPill>
                  <span className={styles.reason}>{strings.reason[item.reason]}</span>
                </div>
                <div className={styles.actions}>
                  <Button variant="secondary" size="sm" href={item.planHref}>{strings.plan}</Button>
                  <Button variant="tertiary" size="sm" href={item.reviewHref}>{strings.review}</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
