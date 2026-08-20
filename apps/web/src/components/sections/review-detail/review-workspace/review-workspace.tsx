import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import DecisionPanel from "@/components/sections/review-detail/decision-panel/decision-panel";
import FindingTraceChain from "@/components/sections/review-detail/finding-trace-chain/finding-trace-chain";
import ReviewPanels from "@/components/sections/review-detail/review-panels/review-panels";
import ReviewTabs, { type ReviewTab } from "@/components/sections/review-detail/review-tabs/review-tabs";
import StartReview from "@/components/sections/review-detail/start-review/start-review";
import type { ReviewDetailLoad } from "@/features/reviews/detail";
import type { ReviewsStrings } from "@/features/reviews/strings";
import { fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./review-workspace.module.css";

type Detail = ReviewsStrings["detail"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECISIONS = ["approve", "return", "reject"];

export default function ReviewWorkspace({ loaded, query, strings, locale }: {
  loaded: ReviewDetailLoad;
  query: Record<string, string | undefined>;
  strings: Detail;
  locale: Locale;
}) {
  const ws = strings.ws;
  const statusLabels: Record<string, string> = ws.inspectionStatus;
  const statusLabel = (status: string) => statusLabels[status] ?? status.replace(/_/g, " ");

  if (loaded.kind === "unauthorized") {
    return <EmptyState icon="restricted" tone="danger" title={ws.unauthTitle} description={ws.unauthBody} />;
  }
  if (loaded.kind === "missing") {
    return loaded.degraded
      ? <EmptyState icon="risk" tone="warning" title={ws.loadError} description={ws.loadErrorDesc} />
      : <EmptyState icon="search" title={ws.notFound} description={ws.notFoundDesc} />;
  }

  const tabs: readonly ReviewTab[] = [
    { key: "checklist", label: ws.tab.checklist, count: loaded.answers.length },
    { key: "evidence", label: ws.tab.evidence, count: loaded.violations.length },
    { key: "factory", label: ws.tab.factory, count: loaded.factoryChecks.length },
    { key: "ack", label: ws.tab.ack, count: loaded.latest?.acknowledgement != null ? 1 : 0 },
    { key: "compare", label: ws.tab.compare, count: loaded.compareVersions.length },
    { key: "timeline", label: ws.tab.timeline, count: loaded.timeline.length },
    { key: "prior", label: ws.tab.prior, count: loaded.decidedReviews.length },
  ];
  const active = tabs.some(tab => tab.key === query.tab) ? query.tab! : tabs[0].key;

  const decision = DECISIONS.includes(query.decision ?? "") ? query.decision : null;
  const correlation = query.correlation && UUID.test(query.correlation) ? query.correlation : null;

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <Heading level={1}>{ws.title.replace("{factory}", loaded.factory.name)}</Heading>
        <span className={styles.chips}>
          <StatusPill tone="info">{statusLabel(loaded.inspectionStatus)}</StatusPill>
          {loaded.latest ? <Mono>v{loaded.latest.version_number} · {ws.latest}</Mono> : null}
          {!loaded.canDecide
            ? <StatusPill tone="warning">{fill(ws.readOnlyRole, { role: loaded.viewerRole ?? "—" })}</StatusPill>
            : null}
        </span>
        <span className={styles.actions}>
          <Button variant="secondary" size="sm" href={`/factories/${loaded.factory.id}`} label={ws.openFactory360}>
            {ws.openFactory360}
          </Button>
          <Button variant="secondary" size="sm" href={`/reports/inspection/${loaded.inspectionId}`} label={ws.reportLink}>
            {ws.reportLink}
          </Button>
        </span>
      </div>

      {correlation && decision ? (
        <EmptyState variant="inline" tone="info" icon="review"
          title={ws.decisionRecorded} description={`${ws.correlation}: ${correlation}`} />
      ) : null}

      <FindingTraceChain traces={loaded.traces} strings={ws.trace} />

      <div className={styles.body}>
        <div className={styles.tabsRow}>
          <ReviewTabs tabs={tabs} active={active} basePath={`/reviews/${loaded.inspectionId}`} />
        </div>

        <div className={styles.record}>
          <ReviewPanels tab={active} data={loaded} strings={strings} locale={locale} />
        </div>

        <div className={styles.side}>
          {!loaded.canDecide ? (
            <Card as="section"><CardBody><Text tone="muted">{ws.readOnlyNote}</Text></CardBody></Card>
          ) : loaded.openReview && loaded.inspectionStatus === "under_review" ? (
            <DecisionPanel
              reviewId={loaded.openReview.id}
              sections={loaded.sections}
              summary={{
                version: loaded.latest?.version_number ?? 0,
                violationCount: loaded.violations.length,
                criticalViolationCount: loaded.violations
                  .filter(v => v.violation_codes?.level.toLowerCase().includes("critical")).length,
                actionFormCount: loaded.actionForms.length,
                evidenceCount: loaded.evidenceRows.length,
                factoryUpdateCount: loaded.factoryUpdated,
              }}
              strings={{ ...ws, heading: ws.panelHeading, decisions: strings.decision }}
            />
          ) : loaded.canStart && loaded.latest ? (
            <StartReview inspectionId={loaded.inspectionId} submissionVersionId={loaded.latest.id}
              strings={{ title: ws.startTitle, body: ws.startBody, start: ws.startAction, starting: ws.starting }} />
          ) : (
            <Card as="section">
              <CardBody>
                <Text tone="muted">{fill(ws.noOpenDecision, { status: statusLabel(loaded.inspectionStatus) })}</Text>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
