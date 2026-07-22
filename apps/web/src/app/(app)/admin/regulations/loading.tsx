import { SkeletonBlock } from "@/components/Skeleton";
import { useT } from "@/lib/i18n";

// SCR-ADM-010/011 · S02_LOADING — structure-first skeleton shown while the register
// read is in flight. It shows no counts and no health verdict (counts are unknown until
// the read returns), only shape.
export default async function Loading() {
  const { t } = await useT();
  return (
    <div className="ax-content stack" style={{ gap: "var(--space-4)" }} role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t("admin.reg.r1.loading", "Loading regulation register…")}</span>
      <div className="panel" style={{ padding: "var(--space-6)" }}>
        <SkeletonBlock inlineSize="40%" blockSize={20} ariaHidden />
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className="panel stack" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }}>
          <SkeletonBlock inlineSize="55%" blockSize={18} ariaHidden />
          <SkeletonBlock inlineSize="80%" blockSize={40} ariaHidden />
        </div>
      ))}
    </div>
  );
}
