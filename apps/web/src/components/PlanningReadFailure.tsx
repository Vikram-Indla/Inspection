import EmptyState from "@/components/EmptyState";
import type { PlanningReadFailure } from "@/lib/planning/read-contract";

type PlanningReadFailureProps = {
  failure: PlanningReadFailure;
  title: string;
  body: string;
  referenceLabel: string;
  retryLabel: string;
  retryHref: string;
};

export default function PlanningReadFailureState({
  failure,
  title,
  body,
  referenceLabel,
  retryLabel,
  retryHref,
}: PlanningReadFailureProps) {
  return (
    <EmptyState
      glyph="⚠"
      role="alert"
      title={title}
      body={<>{body} <span className="id-code">{referenceLabel}: {failure.code} · {failure.correlationId}</span></>}
    >
      <a className="btn btn-secondary" href={retryHref}>{retryLabel}</a>
    </EmptyState>
  );
}
