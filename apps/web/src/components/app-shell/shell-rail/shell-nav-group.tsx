"use client";

import { usePathname } from "next/navigation";
import { type CSSProperties } from "react";
import Icon from "@/components/saqeel/icon/icon";
import { isShellRouteCurrent } from "@/lib/shell-navigation";
import type { ShellNavGroup, ShellNavItem, ShellNavSubgroup } from "@/features/shell/types";
import ShellNavItemLink from "./shell-nav-item";
import styles from "./shell-rail.module.css";

type ShellNavGroupProps = {
  group: ShellNavGroup;
  pathname: string;
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

function Subgroup({ entry, groupId, pathname }: {
  entry: ShellNavSubgroup;
  groupId: string;
  pathname: string;
}) {
  const rowsAfter = rowsAfterActive(entry.items, pathname);
  return (
    <div
      className={styles.subgroup}
      role="group"
      aria-labelledby={`sqx-nav-${groupId}-${entry.id}`}
      data-holds-current={rowsAfter === null ? undefined : ""}
      style={connectorStyle(rowsAfter)}
    >
      <p className={styles.subgroupLabel} id={`sqx-nav-${groupId}-${entry.id}`}>
        <Icon name={entry.icon} size="md" />
        <span>{entry.label}</span>
      </p>
      {entry.items.map(item => (
        <ShellNavItemLink
          key={item.id}
          item={item}
          isChild
          isCurrent={isShellRouteCurrent(pathname, item.href)}
        />
      ))}
    </div>
  );
}

export default function ShellNavGroupSection({ group, pathname }: ShellNavGroupProps) {
  const livePathname = usePathname() || pathname;
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
        <span className={styles.groupLabel}>{group.label}</span>
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
              isCurrent={isShellRouteCurrent(livePathname, entry.item.href)}
            />
          ) : (
            <Subgroup key={entry.id} entry={entry} groupId={group.id} pathname={livePathname} />
          ),
        )}
      </div>
    </details>
  );
}
