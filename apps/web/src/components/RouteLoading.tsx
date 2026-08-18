import { getLocale } from "@/lib/i18n";
import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/saqeel/skeleton/skeleton";

export default async function RouteLoading({ en, ar, bodyEn, bodyAr, framed }: {
  en: string; ar: string; bodyEn?: string; bodyAr?: string; framed?: boolean;
}) {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const label = [isAr ? ar : en, isAr ? bodyAr : bodyEn].filter(Boolean).join(" ");

  const region = (
    <SkeletonRegion label={label}>
      <Skeleton shape="line" size="xl" width="half" />
      <SkeletonText lines={1} width="wide" />
      <Skeleton shape="block" width="full" />
      <Skeleton shape="block" width="full" />
    </SkeletonRegion>
  );

  return framed ? <ShellPageFrame>{region}</ShellPageFrame> : region;
}
