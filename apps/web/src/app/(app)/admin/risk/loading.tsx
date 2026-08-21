import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/saqeel/skeleton/skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import styles from "@/components/sections/admin-risk/admin-risk.module.css";

export default async function Loading() {
  const locale = await getLocale();

  return (
    <ShellPageFrame>
      <SkeletonRegion label={getMessages(locale).adminRisk.loading}>
        <div className={styles.stack}>
          <Skeleton shape="line" size="xl" width="half" />
          <SkeletonText lines={1} width="wide" />
          <div className={styles.bandChips}>
            <Skeleton shape="pill" width="narrow" />
            <Skeleton shape="pill" width="narrow" />
          </div>
          <div className={styles.metrics}>
            <Skeleton shape="block" width="full" />
            <Skeleton shape="block" width="full" />
            <Skeleton shape="block" width="full" />
          </div>
          <Skeleton shape="block" width="full" />
          <div className={styles.footer}>
            <Skeleton shape="block" width="full" />
            <Skeleton shape="block" width="full" />
            <div className={styles.span}><Skeleton shape="block" width="full" /></div>
          </div>
        </div>
      </SkeletonRegion>
    </ShellPageFrame>
  );
}
