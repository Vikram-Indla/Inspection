import Link from "next/link";
import Icon from "@/components/saqeel/icon/icon";
import { localeHref, type Locale } from "@/lib/locale-path";
import type { ShellNavItem } from "@/features/shell/types";
import styles from "./shell-rail.module.css";

type ShellNavItemProps = {
  item: ShellNavItem;
  locale: Locale;
  isCurrent: boolean;
  isChild?: boolean;
  onNavigateLabel?: string;
};

export default function ShellNavItemLink({ item, locale, isCurrent, isChild }: ShellNavItemProps) {
  if (!item.enabled) {
    const reason = item.disabledReason ?? "";
    return (
      <span
        className={styles.item}
        data-child={isChild ? "" : undefined}
        data-state="restricted"
        role="link"
        aria-disabled="true"
        aria-label={`${item.label}. ${reason}`.trim()}
        title={`${item.label} — ${reason}`.trim()}
        tabIndex={0}
      >
        <Icon name={item.icon} size="md" />
        <span className={styles.itemLabel}>{item.label}</span>
        {item.badge ? <span className={styles.itemBadge}>{item.badge}</span> : null}
        <span className={styles.itemLock}>
          <Icon name="restricted" size="sm" />
        </span>
        <span className="sqx-visually-hidden">{reason}</span>
      </span>
    );
  }

  return (
    <Link
      className={styles.item}
      data-child={isChild ? "" : undefined}
      data-state="enabled"
      href={localeHref(locale, item.href)}
      title={item.label}
      aria-current={isCurrent ? "page" : undefined}
      data-next-spa="true"
    >
      <Icon name={item.icon} size="md" />
      <span className={styles.itemLabel}>{item.label}</span>
      {item.badge ? <span className={styles.itemBadge}>{item.badge}</span> : null}
    </Link>
  );
}
