import Shell from "@/components/Shell";
import { SkeletonBlock } from "@/components/Skeleton";
import { useT } from "@/lib/i18n";

// CD-007 / SCR-ADM-020 — S02_LOADING. Streamed while the server reads run. Skeleton
// rows carry NO counts and NO verdicts (loading is never rendered as empty/zero).
export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell
      current="/admin/items"
      title={t("admin.items.r2.title", "Inspection Item Catalogue")}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-020 · ENG-01</span>}
    >
      <div className="sr-only" role="status">{t("admin.items.r2.loading", "Loading the item catalogue…")}</div>
      <section className="ax-surface ax-stack" aria-hidden="true" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-200)" }}>
        <SkeletonBlock inlineSize="40%" blockSize={20} />
        {[0, 1, 2, 3, 4].map(n => (
          <SkeletonBlock key={n} inlineSize="100%" blockSize={24} />
        ))}
      </section>
    </Shell>
  );
}
