import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { useT } from "@/lib/i18n";

// SCR-WEB-500 — loading state (web.md: every screen needs loading/empty/error states)
export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/operations" title={t("ops.title", "Operations Center")}>
      <EmptyState glyph="⏳" title={t("ops.loading.title", "Loading Operations Center…")}
        body={t("ops.loading.desc", "Fetching visits, geo events, corrective actions and notifications through RLS.")} />
    </Shell>
  );
}
