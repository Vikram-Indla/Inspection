import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";

// CD-043 / SCR-VIR-720 (S08) — session-boundary loading fallback. Next.js shows
// this only while the async server component genuinely awaits the session read
// (state, package, participants, timeline); it never fabricates progress and is
// replaced the moment real data resolves.
export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/virtual" title={t("virtual.room.loadingTitle", "Virtual session")}>
      <div className="ax-surface" role="status" aria-busy="true">
        <div className="ax-state">
          <span className="ax-state__glyph">…</span>
          <h4>{t("virtual.room.loading", "Loading session")}</h4>
          <p className="ax-caption">{t("virtual.room.loadingDesc", "Reading the session state, frozen package, participants and timeline (SCR-VIR-720).")}</p>
        </div>
        <div className="cd-vir" aria-hidden="true" style={{ marginBlockStart: "var(--ax-space-300)" }}>
          <div className="ax-skeleton" style={{ blockSize: 56, marginBlockEnd: "var(--ax-space-200)" }} />
          <div className="ax-skeleton" style={{ blockSize: 180, marginBlockEnd: "var(--ax-space-200)" }} />
          <div className="ax-skeleton" style={{ blockSize: 120 }} />
        </div>
      </div>
    </Shell>
  );
}
