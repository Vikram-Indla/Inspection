import Shell from "@/components/Shell";
import BulkTargetingSkeleton from "@/components/sections/planning-bulk/bulk-targeting-skeleton/bulk-targeting-skeleton";
import { bulkMessages, buildScreenStrings } from "@/features/planning-bulk/strings";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  const locale = await getLocale();

  return (
    <Shell current="/planning" title={buildScreenStrings(locale).title}>
      <BulkTargetingSkeleton label={bulkMessages(locale).loading} />
    </Shell>
  );
}
