import RegulationsSkeleton from "@/components/sections/regulations/catalogue/regulations-skeleton/regulations-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function ComplianceLoading() {
  const { regulations } = getMessages(await getLocale());
  return <RegulationsSkeleton label={regulations.loading} />;
}
