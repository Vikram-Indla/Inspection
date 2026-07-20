import Shell from "@/components/Shell";
import { SkeletonBlock } from "@/components/Skeleton";
import { useT } from "@/lib/i18n";

export default async function ViolationsLoading() {
  const { t } = await useT();
  return (
    <Shell current="/admin" title={t("admin.viol.r2.title", "Violation Catalogue")} context={<span className="badge badge-info">SCR-ADM-040/041 · ENG-08</span>}>
      <section className="stack" aria-busy="true" aria-live="polite" aria-label={t("admin.viol.loading.aria", "Loading violation configuration")}>
        <span className="t-caption">{t("admin.viol.loading", "Loading violation catalogue and penalty mappings…")}</span>
        {[0, 1, 2].map(index => (
          <div key={index} className="ax-surface stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }}>
            <SkeletonBlock inlineSize="35%" blockSize={24} />
            <SkeletonBlock inlineSize="70%" blockSize={16} />
            <SkeletonBlock inlineSize="55%" blockSize={16} />
          </div>
        ))}
      </section>
    </Shell>
  );
}
