import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";

export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/visits" title={t("visit.detail.loadingTitle", "Visit")}>
      <div className="ax-surface"><div className="ax-state">
        <span className="ax-state__glyph">…</span><h4>{t("visit.detail.loading", "Loading visit")}</h4>
        <p className="ax-caption">{t("visit.detail.loadingDesc", "Fetching lifecycle, assignment and inspection state (M02-002).")}</p>
      </div></div>
    </Shell>
  );
}
