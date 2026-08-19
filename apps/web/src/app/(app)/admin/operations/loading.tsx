import OperationsSkeleton from "@/components/sections/admin-operations/operations-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingOperations() {
  const locale = await getLocale();
  return <OperationsSkeleton label={getMessages(locale).adminOperations.loading} />;
}
