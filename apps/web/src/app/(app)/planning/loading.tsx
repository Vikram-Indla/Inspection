import Shell from "@/components/Shell";
import PlanningSkeleton from "@/components/sections/planning/planning-skeleton/planning-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  const { planning } = getMessages(await getLocale());
  return (
    <Shell current="/planning" title="">
      <PlanningSkeleton label={planning.home.loading} />
    </Shell>
  );
}
