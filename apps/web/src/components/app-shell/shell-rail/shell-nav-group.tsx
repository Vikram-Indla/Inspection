"use client";

import { usePathname } from "next/navigation";
import { type CSSProperties } from "react";
import Icon from "@/components/saqeel/icon/icon";
import { Overline, Text } from "@/components/saqeel/type";
import { stripLocale, type Locale } from "@/lib/locale-path";
import { shellRouteOf } from "@/lib/route-rewrites";
import { isShellRouteCurrent } from "@/lib/shell-navigation";
import type { ShellNavGroup, ShellNavItem, ShellNavSubgroup } from "@/features/shell/types";
import ShellNavItemLink from "./shell-nav-item";
import styles from "./shell-rail.module.css";

type ShellNavGroupProps = {
  group: ShellNavGroup;
  locale: Locale;
  pathname: string;
  /**
   * Which rail instance this belongs to. The rail renders twice — once as the
   * desktop rail, once inside the mobile drawer — so a subgroup id built from
   * the group and entry alone appears twice in one document, and every
   * `aria-labelledby` pointing at it resolves to whichever came first.
   */
  variant: string;
};

type ConnectorStyle = CSSProperties & Record<"--sqx-rows-after-active", string>;

function rowsAfterActive(items: readonly ShellNavItem[], pathname: string): number | null {
  const index = items.findIndex(item => isShellRouteCurrent(pathname, item.href));
  return index < 0 ? null : items.length - 1 - index;
}

function connectorStyle(rowsAfter: number | null): ConnectorStyle | undefined {
  if (rowsAfter === null) return undefined;
  return { "--sqx-rows-after-active": String(rowsAfter) };
}

function Subgroup({ entry, groupId, locale, pathname, variant }: {
  entry: ShellNavSubgroup;
  groupId: string;
  locale: Locale;
  pathname: string;
  variant: string;
}) {
  const rowsAfter = rowsAfterActive(entry.items, pathname);
  const labelId = `sqx-nav-${variant}-${groupId}-${entry.id}`;
  return (
    <div
      className={styles.subgroup}
      role="group"
      aria-labelledby={labelId}
      data-holds-current={rowsAfter === null ? undefined : ""}
      style={connectorStyle(rowsAfter)}
    >
      <p className={styles.subgroupLabel} id={labelId}>
        <Icon name={entry.icon} size="md" />
        <Text as="span" role="label" tone="inherit">{entry.label}</Text>
      </p>
      {entry.items.map(item => (
        <ShellNavItemLink
          key={item.id}
          item={item}
          locale={locale}
          isChild
          isCurrent={isShellRouteCurrent(pathname, item.href)}
        />
      ))}
    </div>
  );
}

export default function ShellNavGroupSection({ group, locale, pathname, variant }: ShellNavGroupProps) {
  const livePathname = shellRouteOf(stripLocale(usePathname() || pathname));
  const holdsCurrentRoute = group.items.some(item => isShellRouteCurrent(livePathname, item.href));

  return (
    <details
      className={styles.group}
      data-pinned={group.isAdministration ? "" : undefined}
      data-current={holdsCurrentRoute ? "" : undefined}
      open={holdsCurrentRoute || !group.isAdministration}
    >
      <summary className={styles.groupSummary}>
        {group.isAdministration ? <Icon name="admin" size="md" /> : null}
        <span className={styles.groupLabel}>
          <Overline as="span" tone="inherit">{group.label}</Overline>
        </span>
        <span className={styles.groupChevron}>
          <Icon name="disclosure" size="sm" />
        </span>
      </summary>

      <div className={styles.groupItems}>
        {group.entries.map(entry =>
          entry.kind === "item" ? (
            <ShellNavItemLink
              key={entry.item.id}
              item={entry.item}
              locale={locale}
              isCurrent={isShellRouteCurrent(livePathname, entry.item.href)}
            />
          ) : (
            <Subgroup key={entry.id} entry={entry} groupId={group.id} locale={locale} pathname={livePathname} variant={variant} />
          ),
        )}
      </div>
    </details>
  );
}
