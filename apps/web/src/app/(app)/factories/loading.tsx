import { SkeletonBlock } from "@/components/Skeleton";
import { useT } from "@/lib/i18n";

// SCR-WEB-400 — loading state for the factory registry.
export default async function Loading() {
  const { t } = await useT();
  return (
    <div style={{ padding: "var(--space-8)", display: "grid", gap: "var(--space-4)" }} aria-busy="true" aria-label={t("f360.loading", "Loading factories")}>
      <SkeletonBlock blockSize={28} inlineSize="30%" />
      <SkeletonBlock blockSize={220} />
    </div>
  );
}
