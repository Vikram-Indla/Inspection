import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/saqeel/skeleton/skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function FieldSettingsLoading() {
  const label = getMessages(await getLocale()).fieldSettings.loading;
  return (
    <SkeletonRegion label={label}>
      <Skeleton shape="line" size="xl" width="half" />
      <SkeletonText lines={1} width="wide" />
      <Skeleton shape="block" width="full" />
      <Skeleton shape="block" width="full" />
    </SkeletonRegion>
  );
}
