import Shell from "@/components/Shell";
import ImmediateFormSkeleton from "@/components/sections/planning-immediate/immediate-form-skeleton/immediate-form-skeleton";
import { immediateMessages, immediateScreenStrings } from "@/features/planning-immediate/strings";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  const locale = await getLocale();

  return (
    <Shell current="/planning" title={immediateScreenStrings(locale).title}>
      <ImmediateFormSkeleton label={immediateMessages(locale).loading} />
    </Shell>
  );
}
