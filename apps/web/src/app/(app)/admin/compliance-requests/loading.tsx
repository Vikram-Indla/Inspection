export default function Loading() {
  return <div className="panel"><div className="sq-state" role="status"><span className="sq-state__glyph" aria-hidden="true">◌</span><h4>Loading configuration requests…</h4><p className="t-caption">Reading the RLS-scoped request register and immutable revisions.</p></div></div>;
}
