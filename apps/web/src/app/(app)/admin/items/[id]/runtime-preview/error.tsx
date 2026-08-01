"use client";

export default function RuntimePreviewError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="panel"><div className="sq-state" role="alert"><span className="sq-state__glyph" aria-hidden="true">⚠</span><h4>Runtime preview can&apos;t load</h4><p className="t-caption">The preview could not be read. No configuration has been changed.</p><button className="btn btn-secondary btn-touch" type="button" onClick={() => reset()}>Retry preview</button></div></div>;
}
