import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";

// SCR-WEB-500 — loading state (web.md: every screen needs loading/empty/error states)
export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/operations" title={t("ops.title", "Operations Center")}>
      <div className="ax-surface"><div className="ax-state">
        <span className="ax-state__glyph">⏳</span><h4>{t("ops.loading.title", "Loading Operations Center…")}</h4>
        <p className="ax-caption">{t("ops.loading.desc", "Fetching visits, geo events, corrective actions and notifications through RLS.")}</p>
      </div></div>
    </Shell>
  );
}
