"use client";

export default function ComplianceApprovalQueueError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="ax-surface"><div className="ax-state" role="alert"><span className="ax-state__glyph" aria-hidden="true">⚠</span><h4>Compliance Approval Queue unavailable</h4><p className="t-caption">No request state or workload has been inferred, and no decision was recorded.</p><button className="ax-btn ax-btn--secondary" type="button" onClick={() => reset()}>Retry queue</button></div></div>;
}
