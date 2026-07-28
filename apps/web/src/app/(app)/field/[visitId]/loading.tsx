import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { useT } from "@/lib/i18n";

export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/field" title={t("field.start.loadingTitle", "Startup")}>
      <EmptyState glyph="…" title={t("field.start.loading", "Loading visit startup")}
        body={t("field.start.loadingDesc", "Fetching visit window, package version and geofence configuration.")} />
    </Shell>
  );
}
