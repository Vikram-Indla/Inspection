"use client";
import RouteError from "@/components/saqeel/route-error/route-error";

export default function BulkPlanningError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="Bulk targeting could not be shown"
      body="Nothing was selected, saved or published. Your criteria are still in the address bar — retry, or go back to planning."
      retryLabel="Retry"
      referenceLabel="Reference"
      reference={error.digest}
      onRetry={reset}
    />
  );
}
