import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { titleCase } from "@/features/factories/portfolio";
import { queryRecordedDependents } from "@/features/approvals/dependents";
import { approvalHref, type ApprovalScope } from "@/features/approvals/params";
import { queryApprovalDetail, queryApprovalQueue } from "@/features/approvals/queries";
import { buildApprovalTimeline } from "@/features/approvals/timeline";
import {
  breakdownOf, componentsForStep, componentsOf, dependentCount,
  missingCommentCount, packageSummary, parentsOf, stepStates,
} from "@/features/approvals/rows";
import { fill, getMessages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./approval-queue-screen.module.css";
import ApprovalRequestRail from "../approval-request-rail/approval-request-rail";
import ApprovalStepNav from "../approval-step-nav/approval-step-nav";
import ApprovalObjectCard from "../../review/approval-object-card/approval-object-card";
import ApprovalOverview from "../../review/approval-overview/approval-overview";
import ApprovalSummary from "../../review/approval-summary/approval-summary";
import ApprovalPackageDecision from "../../package/approval-package-decision/approval-package-decision";
import ApprovalProgress from "../../package/approval-progress/approval-progress";
import ApprovalTimeline from "../../package/approval-timeline/approval-timeline";

const PUBLISHABLE_STATUSES = ["approved", "partially_approved"];
const REVIEWABLE_STATUSES = ["pending_review", "partially_approved"];

export default async function ApprovalQueueScreen({ locale, scope }: {
  locale: Locale;
  scope: ApprovalScope;
}) {
  const { approvals } = getMessages(locale);
  const queue = await queryApprovalQueue(scope);
  const label = (value: string) => approvals.enum[value as keyof typeof approvals.enum] ?? titleCase(value);
  const stamp = (iso: string) => formatDateTime(iso, locale);

  if (queue.access.kind === "signed-out") {
    return <Notice title={approvals.access.signedOutTitle} body={approvals.access.signedOutBody} tone="danger" />;
  }
  if (!queue.queueReadable) {
    return <Notice title={approvals.degraded.title} body={approvals.degraded.body} tone="danger" />;
  }

  const selected = queue.requests.find(row => row.id === scope.requestId) ?? queue.requests[0] ?? null;
  if (!selected) {
    return <Notice title={approvals.empty.title} body={approvals.empty.body} tone="neutral" />;
  }

  const components = componentsOf(queue.components, selected);
  const [detail, recorded] = await Promise.all([
    queryApprovalDetail(selected.id, selected.current_revision),
    queryRecordedDependents(components),
  ]);

  const groups = stepStates(components);
  const overall = breakdownOf(components);
  const stepped = componentsForStep(components, scope.step);
  const canReview = queue.access.kind === "reviewer";
  const allDecided = components.length > 0 && overall.pending === 0;
  const href = (overrides: Parameters<typeof approvalHref>[1]) => localeHref(locale, approvalHref(scope, overrides));

  const requesterOf = (ownerId: string) => queue.namesReadable ? queue.names.get(ownerId) ?? null : null;
  const publishedOf = (componentId: string) =>
    detail.publications.find(row => row.component_id === componentId)?.version_id ?? null;

  const timeline = buildApprovalTimeline(detail, approvals.timeline, {
    stamp,
    name: requesterOf,
    label,
  });


  return (
    <div className={styles.layout}>
      <ApprovalRequestRail
        entries={queue.requests.map(request => {
          const scoped = componentsOf(queue.components, request);
          const breakdown = breakdownOf(scoped);
          return {
            request,
            requester: requesterOf(request.owner_id),
            submitted: request.submitted_at ? stamp(request.submitted_at) : null,
            chips: [...packageSummary(scoped).byKind.entries()]
              .map(([kind, count]) => ({ key: kind, label: `${label(kind)} ${count}` })),
            progress: fill(approvals.rail.progress, { decided: breakdown.decided, total: breakdown.total }),
          };
        })}
        selectedId={selected.id}
        hrefFor={request => href({ requestId: request.id, step: "overview" })}
        statusLabelFor={label}
        typeLabelFor={label}
        strings={approvals.rail}
      />

      <div className={styles.main}>
        <ApprovalStepNav
          current={scope.step}
          label={approvals.steps.label}
          entries={groups.map(group => ({
            state: group,
            label: approvals.steps[group.step],
            detail: group.step === "overview"
              ? approvals.steps.read
              : group.step === "summary"
                ? (allDecided ? approvals.steps.ready : approvals.steps.pending)
                : group.breakdown.total === 0
                  ? approvals.steps.none
                  : fill(approvals.steps.settledOf, { decided: group.breakdown.decided, total: group.breakdown.total }),
            href: href({ requestId: selected.id, step: group.step }),
          }))}
        />

        <Card as="section" labelledBy="approval-review">
          <CardHeader
            level="h2"
            titleId="approval-review"
            title={<bdi>{selected.title}</bdi>}
            description={<bdi>{selected.request_number}</bdi>}
          />
          <CardBody gap="tight">
            {scope.step === "overview" ? (
              <ApprovalOverview
                request={selected}
                summary={packageSummary(components)}
                requester={requesterOf(selected.owner_id)}
                submitted={selected.submitted_at ? stamp(selected.submitted_at) : null}
                typeLabel={label(selected.request_type)}
                statusLabel={label(selected.status)}
                kindLabel={label}
                strings={approvals.overview}
              />
            ) : scope.step === "summary" ? (
              <ApprovalSummary
                groups={groups.filter(group => group.step !== "overview" && group.step !== "summary")}
                missingComments={missingCommentCount(components)}
                ready={allDecided}
                labelFor={step => approvals.steps[step as keyof typeof approvals.steps] ?? titleCase(step)}
                strings={approvals.summary}
              />
            ) : !detail.detailReadable ? (
              <EmptyState tone="warning" title={approvals.degraded.detail} size="sm" />
            ) : stepped.length === 0 ? (
              <EmptyState title={approvals.empty.stepTitle} description={approvals.empty.stepBody} size="sm" />
            ) : (
              <div className={styles.objects}>
                {stepped.map(component => (
                  <ApprovalObjectCard
                    key={component.id}
                    component={component}
                    parents={parentsOf(component.id, detail.dependencies, components)}
                    dependents={dependentCount(component.id, detail.dependencies, components)}
                    recorded={recorded.byComponent.get(component.id)}
                    recordedReadable={recorded.readable}
                    canDecide={canReview && REVIEWABLE_STATUSES.includes(selected.status)}
                    publishedVersion={publishedOf(component.id)}
                    kindLabel={label}
                    statusLabel={label}
                    fieldLabel={label}
                    strings={approvals.object}
                  />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className={styles.aside}>
        <ApprovalProgress
          groups={groups.filter(group => group.step !== "overview" && group.step !== "summary")}
          decided={overall.decided}
          total={overall.total}
          labelFor={step => approvals.steps[step as keyof typeof approvals.steps] ?? titleCase(step)}
          strings={approvals.progress}
        />
        <ApprovalPackageDecision
          requestId={selected.id}
          canReview={canReview}
          allDecided={allDecided}
          publishable={canReview && detail.detailReadable && allDecided && PUBLISHABLE_STATUSES.includes(selected.status)}
          reviewable={canReview && detail.detailReadable && REVIEWABLE_STATUSES.includes(selected.status)}
          strings={approvals.package}
        />
        <ApprovalTimeline events={timeline} strings={approvals.timeline} />
      </div>
    </div>
  );
}

function Notice({ title, body, tone }: { title: string; body: string; tone: "danger" | "neutral" }) {
  return (
    <Card as="section" labelledBy="approval-notice">
      <CardHeader level="h2" titleId="approval-notice" title={title} />
      <CardBody>
        <EmptyState tone={tone} title={body} size="sm" />
      </CardBody>
    </Card>
  );
}
