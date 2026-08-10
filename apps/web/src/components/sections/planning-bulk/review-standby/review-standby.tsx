import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Stack from "@/components/saqeel/stack/stack";
import { Card, CardBody } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import styles from "./review-standby.module.css";

export type ReviewStandbyStrings = {
  loading: string;
  loadingNote: string;
  stagedBanner: string;
  stagedSub: string;
  unavailable: string;
  unavailableTag: string;
  scopeTitle: string;
  scopeBody: string;
  emptyTitle: string;
  emptyBody: string;
  backToTargeting: string;
  draftUnavailable: string;
};

const SKELETON_ROWS = 4;

export function ReviewLoading({ strings }: { strings: ReviewStandbyStrings }) {
  return (
    <Card as="section">
      <CardBody gap="default">
        <PlanningNotice tone="info" label={strings.stagedSub}>{strings.stagedBanner}</PlanningNotice>
        <SkeletonRegion label={strings.loading}>
          <Stack gap="tight">
            {Array.from({ length: SKELETON_ROWS }, (_unused, row) => (
              <Skeleton key={row} shape="line" width="full" size="xl" />
            ))}
          </Stack>
        </SkeletonRegion>
        <p className={styles.note} role="status">{strings.loadingNote}</p>
      </CardBody>
    </Card>
  );
}

export function ReviewUnavailable({ strings }: { strings: ReviewStandbyStrings }) {
  return <PlanningNotice tone="danger" label={strings.unavailableTag}>{strings.unavailable}</PlanningNotice>;
}

export function ReviewOutOfScope({ missingCount, strings }: {
  missingCount: number;
  strings: ReviewStandbyStrings;
}) {
  return (
    <EmptyState
      icon="risk"
      tone="warning"
      title={strings.scopeTitle}
      description={strings.scopeBody.replace("{n}", String(missingCount))}
      action={<Button variant="primary" href="/planning/bulk">{strings.backToTargeting}</Button>}
    />
  );
}

export function ReviewEmpty({ draftUnavailable, strings }: {
  draftUnavailable: boolean;
  strings: ReviewStandbyStrings;
}) {
  return (
    <Stack gap="default">
      {draftUnavailable && (
        <PlanningNotice tone="warning" label={strings.unavailableTag}>{strings.draftUnavailable}</PlanningNotice>
      )}
      <EmptyState
        icon="factory"
        title={strings.emptyTitle}
        description={strings.emptyBody}
        action={<Button variant="primary" href="/planning/bulk">{strings.backToTargeting}</Button>}
      />
    </Stack>
  );
}
