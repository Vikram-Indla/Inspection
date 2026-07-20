"use client";

export default function RuntimePreviewError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="ax-surface"><div className="ax-state" role="alert"><span className="ax-state__glyph" aria-hidden="true">⚠</span><h4>Runtime preview unavailable</h4><p className="t-caption">The preview could not be read. No configuration has been changed.</p><button className="ax-btn ax-btn--secondary" type="button" onClick={() => reset()}>Retry preview</button></div></div>;
}
