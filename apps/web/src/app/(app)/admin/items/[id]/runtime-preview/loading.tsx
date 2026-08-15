import Shell from "@/components/Shell";

export default function RuntimePreviewLoading() {
  return (
    <Shell current="/admin/items" title="">
      <div className="panel"><div className="sq-state" role="status" aria-live="polite"><span className="sq-state__glyph" aria-hidden="true">◌</span><h4>Loading runtime preview</h4><p className="t-caption">Reading published configuration and final checklist-version context…</p></div></div>
    </Shell>
  );
}
