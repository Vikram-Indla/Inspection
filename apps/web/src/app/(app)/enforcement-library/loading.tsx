import EnforcementSkeleton from "@/components/sections/enforcement/library/enforcement-skeleton/enforcement-skeleton";
import Shell from "@/components/Shell";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function EnforcementLoading() {
  const { enforcement } = getMessages(await getLocale());
  return (
    <Shell current="/enforcement-library" title={enforcement.title}>
      <EnforcementSkeleton label={enforcement.loading} />
    </Shell>
  );
}
