import Shell from "@/components/Shell";
import WorkloadSkeleton from "@/components/sections/visits/visit-workload/workload-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  const { workload } = getMessages(await getLocale()).visits;

  return (
    <Shell current="/visits" title={workload.title}>
      <WorkloadSkeleton label={workload.loading} />
    </Shell>
  );
}
