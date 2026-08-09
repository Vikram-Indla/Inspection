import SingleVisitSkeleton from "@/components/sections/planning-single/single-visit-skeleton/single-visit-skeleton";
import Shell from "@/components/Shell";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  const { planning } = getMessages(await getLocale());
  return (
    <Shell current="/planning" title={planning.single.loading}>
      <SingleVisitSkeleton label={planning.single.loading} />
    </Shell>
  );
}
