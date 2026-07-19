import { SkeletonBlock } from "@/components/Skeleton";
import { useT } from "@/lib/i18n";

// SCR-ADM-010/011 · S02_LOADING — structure-first skeleton shown while the register
// read is in flight. It shows no counts and no health verdict (counts are unknown until
// the read returns), only shape.
export default async function Loading() {
  const { t } = await useT();
  return (
    <div className="ax-content ax-stack" style={{ gap: "var(--ax-space-200)" }} role="status" aria-busy="true" aria-live="polite">
      <span className="ax-sr-only">{t("admin.reg.r1.loading", "Loading regulation register…")}</span>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <SkeletonBlock inlineSize="40%" blockSize={20} ariaHidden />
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }}>
          <SkeletonBlock inlineSize="55%" blockSize={18} ariaHidden />
          <SkeletonBlock inlineSize="80%" blockSize={40} ariaHidden />
        </div>
      ))}
    </div>
  );
}
