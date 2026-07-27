"use client";

import { StateSurface } from "@/components/saqeel/feedback/StateSurface";

export default function ExecutionError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <StateSurface kind="error" title="Execution unavailable" body={`No inspection state was changed.${error.digest ? ` Reference ${error.digest}.` : ""}`} action={<button className="sq-btn sq-btn--secondary" type="button" onClick={reset}>Retry</button>} />;
}
