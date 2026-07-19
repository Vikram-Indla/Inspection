import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { useT } from "@/lib/i18n";

export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/visits" title={t("visit.list.title", "Visit management")}>
      <EmptyState glyph="…" title={t("visit.list.loading", "Loading visits")}
        body={t("visit.list.loadingDesc", "Fetching visits in your organizational scope (M02-001).")} />
    </Shell>
  );
}
