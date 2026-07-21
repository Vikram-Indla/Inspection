"use client";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return <div className="panel"><div className="ax-state" role="alert"><span className="ax-state__glyph" aria-hidden="true">⚠</span><h4>Configuration requests are temporarily unavailable</h4><p className="t-caption">No empty or success state has been inferred. Retry the governed read.</p><button className="btn btn-secondary btn-touch" onClick={reset}>Retry</button></div></div>;
}
