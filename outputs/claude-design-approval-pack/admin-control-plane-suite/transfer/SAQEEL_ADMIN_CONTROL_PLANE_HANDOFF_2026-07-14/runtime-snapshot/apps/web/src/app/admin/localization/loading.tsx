// Route-level loading fallback (must render sync — bilingual static text).
export default function Loading() {
  return (
    <div className="ax-surface" style={{ margin: "var(--ax-space-300)" }}>
      <div className="ax-state">
        <span className="ax-state__glyph">🌐</span>
        <h4>Loading localization… · <span lang="ar">جارٍ تحميل الترجمة…</span></h4>
        <p className="ax-caption">ui_strings · SCR-ADM-100</p>
      </div>
    </div>
  );
}
