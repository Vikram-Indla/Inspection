import { useT } from "@/lib/i18n";
import FactoryDossierSkeleton from "@/components/sections/factories/factory-dossier-skeleton/factory-dossier-skeleton";

export default async function Loading() {
  const { t } = await useT();
  return <FactoryDossierSkeleton label={t("f360.loading.dossier", "Loading factory profile")} />;
}
