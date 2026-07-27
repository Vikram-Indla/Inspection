import { useT } from "@/lib/i18n";

export default async function LoadingFactory360() {
  const { t } = await useT();
  return (
    <div className="saqeel-state saqeel-state--loading" aria-busy="true" aria-label={t("f360.loading", "Loading factories")}>
      <span className="sq-caption">{t("f360.loading", "Loading factories")}</span>
      <div className="saqeel-state__skeletons" aria-hidden="true">
        <span className="sq-skeleton" />
        <span className="sq-skeleton" />
        <span className="sq-skeleton" />
      </div>
    </div>
  );
}
