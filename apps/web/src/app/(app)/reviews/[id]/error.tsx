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
      title="Review record not available"
      body={`We could not tell the decision or workflow state.${error.digest ? ` Reference ${error.digest}.` : ""}`}
      action={<button className="btn btn-secondary" type="button" onClick={reset}>Try again</button>}
    />
  );
}
