import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { buildSingleAccessStrings } from "@/features/planning-single/strings";
import type { SinglePlanningLoad } from "@/features/planning-single/queries";
import { useT } from "@/lib/i18n";

export type SingleAccessProps = { state: Exclude<SinglePlanningLoad, { kind: "ready" }> };

export default async function SingleAccessState({ state }: SingleAccessProps) {
  const { t, locale } = await useT();
  const strings = buildSingleAccessStrings(t, locale === "ar" ? "ar" : "en");

  if (state.kind === "unauthorized") {
    return (
      <EmptyState
        icon="restricted"
        tone="warning"
        title={strings.unauthorizedTitle}
        description={strings.unauthorizedBody}
      />
    );
  }

  const session = state.reason === "session";
  const label = session ? strings.sessionRetry : strings.retry;
  const reference = `${strings.referenceLabel}: ${state.failure.code} · ${state.failure.correlationId}`;

  return (
    <EmptyState
      icon="risk"
      tone="danger"
      title={session ? strings.sessionTitle : strings.failureTitle}
      description={`${session ? strings.sessionBody : strings.failureBody} ${reference}`}
      action={<Button variant="secondary" href={state.retryHref} label={label}>{label}</Button>}
    />
  );
}
