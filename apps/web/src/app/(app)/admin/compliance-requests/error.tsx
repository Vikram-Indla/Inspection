"use client";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return <div className="panel"><div className="sq-state" role="alert"><span className="sq-state__glyph" aria-hidden="true">⚠</span><h4>Configuration requests can't load right now</h4><p className="t-caption">This could not be loaded. Try again.</p><button className="btn btn-secondary btn-touch" onClick={reset}>Retry</button></div></div>;
}
