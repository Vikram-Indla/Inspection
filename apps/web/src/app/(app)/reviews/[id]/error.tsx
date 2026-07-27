"use client";

import { StateSurface } from "@/components/saqeel";

export default function ReviewRecordError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StateSurface
      kind="error"
      title="Review record unavailable"
      body={`No decision or workflow state was inferred.${error.digest ? ` Reference ${error.digest}.` : ""}`}
      action={<button className="btn btn-secondary" type="button" onClick={reset}>Try again</button>}
    />
  );
}
