import { useT } from "@/lib/i18n";

// SCR-WEB-400 — loading state for the factory registry.
export default async function Loading() {
  const { t } = await useT();
  return (
    <div style={{ padding: "var(--ax-space-400)", display: "grid", gap: "var(--ax-space-200)" }} aria-busy="true" aria-label={t("f360.loading", "Loading factories")}>
      <div className="ax-skeleton" style={{ blockSize: 28, inlineSize: "30%" }} />
      <div className="ax-skeleton" style={{ blockSize: 220 }} />
    </div>
  );
}
