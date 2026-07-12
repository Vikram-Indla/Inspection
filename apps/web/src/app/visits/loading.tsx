import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";

export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/visits" title={t("visit.list.title", "Visit management")}>
      <div className="ax-surface"><div className="ax-state">
        <span className="ax-state__glyph">…</span><h4>{t("visit.list.loading", "Loading visits")}</h4>
        <p className="ax-caption">{t("visit.list.loadingDesc", "Fetching visits in your organizational scope (M02-001).")}</p>
      </div></div>
    </Shell>
  );
}
