import { useT } from "@/lib/i18n";

// CD-031 / SCR-WEB-400 — loading state for the Factory 360 dossier.
//
// Reported by Sikander Ahmad: the skeleton did not adopt the layout it loads
// into. The dossier is a three-column workspace with an identity card in the
// side rail, and the loading state was three stacked bars in a centred block,
// so the page visibly jumped when the content arrived. It now uses the same
// workspace and side-rail classes the dossier itself uses, so the shape holds
// still and only the content fills in.
//
// The label said "Loading factories" on a single factory's record — plural,
// on a screen showing one. Corrected to name what is actually loading.
export default async function Loading() {
  const { t } = await useT();
  const label = t("f360.loading.dossier", "Loading factory profile");
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <span className="sq-caption">{label}</span>
      <div className="cd-w3" aria-hidden="true">
        <aside className="cd-side3">
          <div className="sq-surface cd-idcard">
            <span className="sq-skeleton" />
            <span className="sq-skeleton" />
            <span className="sq-skeleton" />
          </div>
        </aside>
        <div className="sq-surface">
          <span className="sq-skeleton" />
          <span className="sq-skeleton" />
          <span className="sq-skeleton" />
          <span className="sq-skeleton" />
        </div>
      </div>
    </div>
  );
}
