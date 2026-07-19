import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";

// Route-level loading fallback (must render sync — bilingual static text,
// same canon as /admin/localization/loading.tsx; no async useT() here).
export default function Loading() {
  return (
    <Shell current="/admin/gis" title={"GIS Studio · استوديو الخرائط"}>
      <EmptyState glyph="…"
        title={<>{"Loading GIS Studio…"} · <span lang="ar">{"جارٍ تحميل استوديو الخرائط…"}</span></>}
        body="ENG-06 · SB20 · SCR-ADM-070" />
    </Shell>
  );
}
