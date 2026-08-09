import Shell from "@/components/Shell";
import VisitsSkeleton from "@/components/sections/visits/visits-skeleton/visits-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  const { visit } = getMessages(await getLocale()).planning;
  return (
    <Shell current="/planning" title={visit.title}>
      <VisitsSkeleton label={visit.state.loading} />
    </Shell>
  );
}
