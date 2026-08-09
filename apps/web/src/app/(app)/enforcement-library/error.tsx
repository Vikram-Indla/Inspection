"use client";
import RouteError from "@/components/saqeel/route-error/route-error";

export default function RouteErrorBoundary({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="This screen could not be loaded"
      body="Nothing was changed. The read failed — no record count or outcome is claimed."
      retryLabel="Retry"
      referenceLabel="Reference"
      reference={error.digest}
      onRetry={reset}
    />
  );
}
