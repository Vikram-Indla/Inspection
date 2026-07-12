import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";

export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/field" title={t("field.start.loadingTitle", "Startup")}>
      <div className="ax-surface"><div className="ax-state">
        <span className="ax-state__glyph">…</span><h4>{t("field.start.loading", "Loading visit startup")}</h4>
        <p className="ax-caption">{t("field.start.loadingDesc", "Fetching visit window, package version and geofence configuration (SCR-IPAD-610 · SB20).")}</p>
      </div></div>
    </Shell>
  );
}
