"use client";

import { StateSurface } from "@/components/saqeel/feedback/StateSurface";

export default function ComplianceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <StateSurface kind="error" title="Inspection Rules unavailable" body={`Nothing could be loaded, and nothing was changed.${error.digest ? ` Reference ${error.digest}.` : ""}`} action={<button className="sq-btn sq-btn--secondary" type="button" onClick={reset}>Retry</button>} />;
}
