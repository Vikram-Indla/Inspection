"use client";
import RouteError from "@/components/saqeel/route-error/route-error";

export default function SinglePlanningError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="The single-visit planner could not be shown"
      body="Nothing was planned, saved or submitted. Your search is still in the address bar — retry, or go back to planning."
      retryLabel="Retry"
      referenceLabel="Reference"
      reference={error.digest}
      onRetry={reset}
    />
  );
}
