import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/saqeel/skeleton/skeleton";
import { getLocale } from "@/lib/i18n";
import styles from "./risk-studio.module.css";

export default async function Loading() {
  const locale = await getLocale();
  const label = locale === "ar" ? "جارٍ تحميل المخاطر…" : "Loading risk…";

  return (
    <ShellPageFrame>
      <SkeletonRegion label={label}>
        <Skeleton shape="line" size="xl" width="half" />
        <SkeletonText lines={1} width="wide" />
        <div className={styles.tabsRow}>
          <Skeleton shape="pill" width="narrow" />
          <Skeleton shape="pill" width="narrow" />
          <Skeleton shape="pill" width="narrow" />
        </div>
        <Skeleton shape="block" width="full" />
        <div className={styles.footer}>
          <Skeleton shape="block" width="full" />
          <Skeleton shape="block" width="full" />
          <div className={styles.span}><Skeleton shape="block" width="full" /></div>
        </div>
      </SkeletonRegion>
    </ShellPageFrame>
  );
}
