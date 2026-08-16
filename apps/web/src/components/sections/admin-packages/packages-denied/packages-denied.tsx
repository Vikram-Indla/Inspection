import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { adminPackagesMessages } from "@/features/admin-packages/strings";
import type { Locale } from "@/lib/i18n";
import styles from "./packages-denied.module.css";

export default function PackagesDenied({ locale }: { locale: Locale }) {
  const strings = adminPackagesMessages(locale);

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.hub },
      ]}
    >
      <EmptyState
        action={
          <div className={styles.actions}>
            <Button href="/admin" variant="secondary">{strings.denied.back}</Button>
            <Button href="/profile" variant="tertiary">{strings.denied.request}</Button>
          </div>
        }
        description={strings.denied.body}
        icon="restricted"
        title={strings.denied.title}
        tone="warning"
      />
    </ShellPageFrame>
  );
}
