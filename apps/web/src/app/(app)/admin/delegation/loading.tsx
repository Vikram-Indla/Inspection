import DelegationSkeleton from "@/components/sections/admin-delegation/delegation-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingDelegation() {
  const locale = await getLocale();
  return <DelegationSkeleton label={getMessages(locale).adminDelegation.loading} />;
}
