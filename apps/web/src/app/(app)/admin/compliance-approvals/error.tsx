"use client";

export default function ComplianceApprovalQueueError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="sq-surface"><div className="sq-state" role="alert"><span className="sq-state__glyph" aria-hidden="true">⚠</span><h4>Awaiting Approval unavailable</h4><p className="sq-caption">No request state or workload has been inferred, and no decision was recorded.</p><button className="sq-btn sq-btn--secondary" type="button" onClick={() => reset()}>Retry queue</button></div></div>;
}
