import BulkTargetingSkeleton from "@/components/sections/planning-bulk/bulk-targeting-skeleton/bulk-targeting-skeleton";
import { bulkMessages } from "@/features/planning-bulk/strings";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  const locale = await getLocale();
  return <BulkTargetingSkeleton label={bulkMessages(locale).loading} />;
}
