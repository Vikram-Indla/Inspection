import { useT } from "@/lib/i18n";
import FactoriesSkeleton from "@/components/sections/factories/factories-skeleton/factories-skeleton";

export default async function Loading() {
  const { t } = await useT();
  return <FactoriesSkeleton label={t("f360.loading", "Loading factories")} />;
}
