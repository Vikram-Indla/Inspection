import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { useT } from "@/lib/i18n";

export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/tasks" title={t("tasks.title", "Tasks")}>
      <EmptyState glyph="…" title={t("tasks.loading", "Loading tasks")}
        body={t("tasks.loadingDesc", "Loading the tasks you can see.")} />
    </Shell>
  );
}
