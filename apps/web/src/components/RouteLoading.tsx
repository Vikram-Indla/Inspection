import { getLocale } from "@/lib/i18n";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/saqeel/skeleton/skeleton";

export default async function RouteLoading({ en, ar, bodyEn, bodyAr }: {
  en: string; ar: string; bodyEn?: string; bodyAr?: string;
}) {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const label = [isAr ? ar : en, isAr ? bodyAr : bodyEn].filter(Boolean).join(" ");

  return (
    <SkeletonRegion label={label}>
      <Skeleton shape="line" size="xl" width="half" />
      <SkeletonText lines={1} width="wide" />
      <Skeleton shape="block" width="full" />
      <Skeleton shape="block" width="full" />
    </SkeletonRegion>
  );
}
