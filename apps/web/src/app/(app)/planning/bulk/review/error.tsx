"use client";
import RouteError from "@/components/saqeel/route-error/route-error";

export default function BulkReviewError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="Plan review could not be shown"
      body="No plan or supervision request was created. Your selection is unchanged — retry, or go back to targeting."
      retryLabel="Retry"
      referenceLabel="Reference"
      reference={error.digest}
      onRetry={reset}
    />
  );
}
