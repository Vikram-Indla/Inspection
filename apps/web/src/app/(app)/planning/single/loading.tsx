import SingleVisitSkeleton from "@/components/sections/planning-single/single-visit-skeleton/single-visit-skeleton";
import Shell from "@/components/Shell";
import { buildSingleVisitStrings } from "@/features/planning-single/strings";
import { getMessages } from "@/i18n/messages";
import { useT } from "@/lib/i18n";

export default async function Loading() {
  const { t, locale } = await useT();
  const { planning } = getMessages(locale);

  return (
    <Shell current="/planning" title={buildSingleVisitStrings(t).title}>
      <SingleVisitSkeleton label={planning.single.loading} />
    </Shell>
  );
}
