"use client";

import { StateSurface } from "@/components/saqeel/feedback/StateSurface";

export default function EnforcementLibraryError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <StateSurface kind="error" title="Enforcement Library unavailable" body={`No case or outcome state was inferred.${error.digest ? ` Reference ${error.digest}.` : ""}`} action={<button className="sq-btn sq-btn--secondary" type="button" onClick={reset}>Retry</button>} />;
}
