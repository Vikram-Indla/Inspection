import Shell from "@/components/Shell";

export default function Loading() {
  return (
    <Shell current="/admin/compliance-requests" title="">
      <div className="panel"><div className="sq-state" role="status"><span className="sq-state__glyph" aria-hidden="true">◌</span><h4>Loading configuration requests…</h4><p className="t-caption">Reading the request list and its final submitted versions.</p></div></div>
    </Shell>
  );
}
