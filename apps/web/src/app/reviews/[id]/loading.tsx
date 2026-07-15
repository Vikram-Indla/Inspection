import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";

// CD-030 / SCR-WEB-320 S11-loading — web.md: every screen needs loading/empty/error states.
export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/reviews" title={t("review.ws.loadingTitle", "Review")}>
      <div className="ax-surface"><div className="ax-state" role="status" aria-busy="true">
        <span className="ax-state__glyph" aria-hidden="true">…</span><h4>{t("review.ws.loading", "Loading review")}</h4>
        <p className="ax-caption">{t("review.ws.loadingDesc", "Fetching checklist, evidence, factory verification and version comparison data (SCR-WEB-320).")}</p>
      </div></div>
    </Shell>
  );
}
