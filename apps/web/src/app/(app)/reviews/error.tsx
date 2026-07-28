"use client";

import { StateSurface } from "@/components/saqeel";

export default function ReviewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StateSurface
      kind="error"
      title="Review queue unavailable"
      body={`No review state was inferred.${error.digest ? ` Reference ${error.digest}.` : ""}`}
      action={<button className="btn btn-secondary" type="button" onClick={reset}>Try again</button>}
    />
  );
}
