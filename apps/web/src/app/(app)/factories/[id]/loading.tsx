import Shell from "@/components/Shell";
import FactoryDossierSkeleton from "@/components/sections/factories/factory-dossier-skeleton/factory-dossier-skeleton";
import { useT } from "@/lib/i18n";

export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/factories" title="">
      <FactoryDossierSkeleton label={t("f360.loading.dossier", "Loading factory profile")} />
    </Shell>
  );
}
