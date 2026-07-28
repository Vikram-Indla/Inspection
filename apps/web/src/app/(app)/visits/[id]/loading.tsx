import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { useT } from "@/lib/i18n";

export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/visits" title={t("visit.detail.loadingTitle", "Visit")}>
      <EmptyState glyph="…" title={t("visit.detail.loading", "Loading visit")}
        body={t("visit.detail.loadingDesc", "Fetching lifecycle, assignment and inspection state.")} />
    </Shell>
  );
}
