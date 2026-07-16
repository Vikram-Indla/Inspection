import Shell from "@/components/Shell";

// Route-level loading fallback (must render sync — bilingual static text,
// same canon as /admin/localization/loading.tsx; no async useT() here).
export default function Loading() {
  return (
    <Shell current="/admin" title={"GIS Studio · استوديو الخرائط"}>
      <div className="ax-surface"><div className="ax-state">
        <span className="ax-state__glyph">…</span>
        <h4>{"Loading GIS Studio…"} · <span lang="ar">{"جارٍ تحميل استوديو الخرائط…"}</span></h4>
        <p className="ax-caption">ENG-06 · SB20 · SCR-ADM-070</p>
      </div></div>
    </Shell>
  );
}
