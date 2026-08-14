import Shell from "@/components/Shell";
import ExecutionSkeleton from "@/components/sections/execution/execution-skeleton/execution-skeleton";
import { buildLoadingStrings, buildScreenStrings } from "@/features/execution/strings";
import { getLocale } from "@/lib/i18n";

export default async function ExecutionLoading() {
  const locale = await getLocale();

  return (
    <Shell current="/execution" title={buildScreenStrings(locale).title}>
      <ExecutionSkeleton label={buildLoadingStrings(locale).label} />
    </Shell>
  );
}
