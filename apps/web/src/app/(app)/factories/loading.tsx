import Shell from "@/components/Shell";
import FactoriesSkeleton from "@/components/sections/factories/factories-skeleton/factories-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  const { factories } = getMessages(await getLocale());
  return (
    <Shell current="/factories" title="">
      <FactoriesSkeleton label={factories.loading} />
    </Shell>
  );
}
