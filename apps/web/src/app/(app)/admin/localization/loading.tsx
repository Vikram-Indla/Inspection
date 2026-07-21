import EmptyState from "@/components/EmptyState";
import { IconGlobe } from "@/app/icons";

// Route-level loading fallback (must render sync — bilingual static text).
export default function Loading() {
  return (
    <div style={{ margin: "var(--ax-space-300)" }}>
      <EmptyState icon={<IconGlobe size={28} />}
        title={<>Loading localization… · <span lang="ar">جارٍ تحميل الترجمة…</span></>}
        body="ui_strings · SCR-ADM-100" />
    </div>
  );
}
