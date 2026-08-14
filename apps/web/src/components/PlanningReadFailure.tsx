import EmptyState from "@/components/EmptyState";
import { Mono } from "@/components/saqeel/type";
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
      body={<>{body} <Mono>{referenceLabel}: {failure.code} · {failure.correlationId}</Mono></>}
    >
      <a className="btn btn-secondary" href={retryHref}>{retryLabel}</a>
    </EmptyState>
  );
}
