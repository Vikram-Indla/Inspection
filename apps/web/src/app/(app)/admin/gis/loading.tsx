import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";

// Route-level loading fallback (must render sync — bilingual static text,
// same canon as /admin/localization/loading.tsx; no async useT() here).
export default function Loading() {
  return (
    <Shell current="/admin/gis" title={"Map Settings · إعدادات الخرائط"}>
      <EmptyState glyph="…"
        title={<>{"Loading Map Settings…"} · <span lang="ar">{"جارٍ تحميل إعدادات الخرائط…"}</span></>}
        body="Preparing map settings and geofence data." />
    </Shell>
  );
}
