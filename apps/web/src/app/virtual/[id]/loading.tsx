import Shell from "@/components/Shell";
import { SkeletonBlock } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { useT } from "@/lib/i18n";

// CD-043 / SCR-VIR-720 (S08) — session-boundary loading fallback. Next.js shows
// this only while the async server component genuinely awaits the session read
// (state, package, participants, timeline); it never fabricates progress and is
// replaced the moment real data resolves.
export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/virtual" title={t("virtual.room.loadingTitle", "Virtual session")}>
      <div className="panel" role="status" aria-busy="true">
        <EmptyState bare glyph="…" title={t("virtual.room.loading", "Loading session")}
          body={t("virtual.room.loadingDesc", "Reading the session state, frozen package, participants and timeline (SCR-VIR-720).")} />
        <div className="cd-vir" aria-hidden="true" style={{ marginBlockStart: "var(--ax-space-300)" }}>
          <SkeletonBlock blockSize={56} style={{ marginBlockEnd: "var(--ax-space-200)" }} />
          <SkeletonBlock blockSize={180} style={{ marginBlockEnd: "var(--ax-space-200)" }} />
          <SkeletonBlock blockSize={120} />
        </div>
      </div>
    </Shell>
  );
}
