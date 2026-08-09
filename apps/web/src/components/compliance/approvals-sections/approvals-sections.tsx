import ApprovalsObjectCard from "@/components/compliance/approvals-object-card/approvals-object-card";
import ApprovalsProgress from "@/components/compliance/approvals-progress/approvals-progress";
import ApprovalsRequests from "@/components/compliance/approvals-requests/approvals-requests";
import ApprovalsSide from "@/components/compliance/approvals-side/approvals-side";
import ApprovalsOverview from "@/components/compliance/approvals-steps/approvals-overview";
import ApprovalsSummary from "@/components/compliance/approvals-steps/approvals-summary";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { stepComponents } from "@/features/compliance/presentation";
import { getApprovalsView } from "@/features/compliance/queries";
import type { ApprovalsScope, ApprovalsView } from "@/features/compliance/types";
import { fill, getMessages, type Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./approvals-sections.module.css";

type ApprovalsMessages = Messages["compliance"]["approvals"];

function StepContent({ view, messages, locale }: {
  view: ApprovalsView;
  messages: ApprovalsMessages;
  locale: Locale;
}) {
  const request = view.selectedRequest;
  if (!request) {
    return <EmptyState icon="review" title={messages.requests.empty} description={messages.requests.emptyBody} />;
  }
  if (view.scope.step === "overview") {
    return <ApprovalsOverview view={view} request={request} messages={messages} locale={locale} />;
  }
  if (view.scope.step === "summary") {
    return <ApprovalsSummary view={view} messages={messages} />;
  }
  const scoped = stepComponents(view.selectedComponents, view.scope.step);
  if (!scoped.length) {
    return <EmptyState title={messages.objects.emptyStep} description={messages.objects.emptyStepBody} size="sm" />;
  }
  const byId = new Map(view.selectedComponents.map(component => [component.id, component]));
  return (
    <>
      {scoped.map(component => (
        <ApprovalsObjectCard
          key={component.id}
          component={component}
          parents={view.dependencies
            .filter(dependency => dependency.child_component_id === component.id)
            .flatMap(dependency => {
              const parent = byId.get(dependency.parent_component_id);
              return parent ? [parent] : [];
            })}
          publication={view.publications.find(publication => publication.component_id === component.id) ?? null}
          canReview={view.canReview && !view.selectedReadFailed}
          requestId={request.id}
          messages={messages}
          locale={locale}
        />
      ))}
    </>
  );
}

export default async function ApprovalsSections({ locale, scope }: {
  locale: Locale;
  scope: ApprovalsScope;
}) {
  const view = await getApprovalsView(scope);
  const messages = getMessages(locale).compliance.approvals;
  if (!view.signedIn) {
    return (
      <div role="alert" data-screen-id="APQ-S01">
        <EmptyState tone="danger" icon="restricted" title={messages.unauthorized} description={messages.unauthorizedBody} />
      </div>
    );
  }
  if (view.readFailed) {
    return (
      <div role="alert" data-screen-id="APQ-S01">
        <EmptyState
          tone="danger"
          icon="risk"
          title={messages.unavailable}
          description={fill(messages.unavailableBody, { reference: view.correlationId ?? "" })}
          action={<Button href={scope.routeBase} prefetch={false}>{messages.retry}</Button>}
        />
      </div>
    );
  }
  return (
    <div className={styles.shell} data-screen-id="APQ-S01">
      <ApprovalsRequests view={view} messages={messages} locale={locale} />
      <div className={styles.center}>
        <ApprovalsProgress view={view} messages={messages} />
        <StepContent view={view} messages={messages} locale={locale} />
      </div>
      {view.selectedRequest ? (
        <ApprovalsSide view={view} request={view.selectedRequest} messages={messages} locale={locale} />
      ) : null}
    </div>
  );
}
