import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";

export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/tasks" title={t("tasks.title", "Task workspace")}>
      <div className="ax-surface"><div className="ax-state">
        <span className="ax-state__glyph">…</span><h4>{t("tasks.loading", "Loading tasks")}</h4>
        <p className="ax-caption">{t("tasks.loadingDesc", "Fetching tasks in your organizational scope (RLS).")}</p>
      </div></div>
    </Shell>
  );
}
