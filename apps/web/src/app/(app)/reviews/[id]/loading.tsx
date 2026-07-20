import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { useT } from "@/lib/i18n";

// CD-030 / SCR-WEB-320 S11-loading — web.md: every screen needs loading/empty/error states.
export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/reviews" title={t("review.ws.loadingTitle", "Review")}>
      <EmptyState role="status" ariaBusy glyph="…" title={t("review.ws.loading", "Loading review")}
        body={t("review.ws.loadingDesc", "Fetching checklist, evidence, factory verification and version comparison data (SCR-WEB-320).")} />
    </Shell>
  );
}
