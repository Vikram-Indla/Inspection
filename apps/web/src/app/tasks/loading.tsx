import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { useT } from "@/lib/i18n";

export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/tasks" title={t("tasks.title", "Task workspace")}>
      <EmptyState glyph="…" title={t("tasks.loading", "Loading tasks")}
        body={t("tasks.loadingDesc", "Fetching tasks in your organizational scope (RLS).")} />
    </Shell>
  );
}
