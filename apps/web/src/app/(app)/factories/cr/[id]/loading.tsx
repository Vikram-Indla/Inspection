import Shell from "@/components/Shell";
import CrSkeleton from "@/components/sections/factories/factory360-cr/cr-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingFactory360Cr() {
  const locale = await getLocale();
  const { factoriesCr: t } = getMessages(locale);
  return (
    <Shell current="/factories" title={t.title}>
      <CrSkeleton label={t.loading} railLabel={t.licenses.heading} contextLabel={t.context.heading} />
    </Shell>
  );
}
