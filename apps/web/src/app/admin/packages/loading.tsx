import Shell from "@/components/Shell";
import { SkeletonBlock } from "@/components/Skeleton";
import { useT } from "@/lib/i18n";

export default async function LoadingPackages() {
  const { t } = await useT();
  return (
    <Shell current="/admin" title={t("admin.pkg.r2.title", "Package library & designer")}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-030/031 · ENG-02</span>}>
      <div className="ax-stack" role="status" aria-live="polite" aria-busy="true" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-300)" }}>
        <span className="sr-only">{t("admin.pkg.loading", "Loading package versions and their governed dependencies…")}</span>
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <SkeletonBlock inlineSize="45%" blockSize={24} />
          <SkeletonBlock inlineSize="75%" blockSize={16} style={{ marginBlockStart: 12 }} />
        </div>
        {[1, 2].map(row => <div key={row} className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <SkeletonBlock inlineSize="35%" blockSize={22} />
          <SkeletonBlock inlineSize="100%" blockSize={100} style={{ marginBlockStart: 16 }} />
        </div>)}
      </div>
    </Shell>
  );
}
