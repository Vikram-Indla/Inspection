"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import Icon from "@/components/saqeel/icon/icon";
import MenuSurface from "@/components/saqeel/menu-surface/menu-surface";
import type { ShellIdentity } from "@/features/shell/types";
import styles from "./shell-user-menu.module.css";

type UserMenuStrings = Readonly<Record<
  "account" | "roles" | "region" | "profileSettings" | "signOut",
  string
>>;

export default function ShellUserMenu({ identity, strings }: {
  identity: ShellIdentity;
  strings: UserMenuStrings;
}) {
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function close(returnFocus: boolean): void {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  return (
    <div className={styles.root}>
      <button
        className={styles.trigger}
        type="button"
        ref={triggerRef}
        aria-label={`${identity.name} — ${identity.roleSummary}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={menuId}
        title={identity.email}
        onClick={() => setIsOpen(value => !value)}
      >
        <span className={styles.avatar} aria-hidden="true">{identity.initials}</span>
        <span className={styles.identity}>
          <span className={styles.name}>{identity.name}</span>
          <span className={styles.role}>{identity.roleSummary}</span>
        </span>
        <Icon name="disclosure" size="sm" />
      </button>

      <MenuSurface
        id={menuId}
        open={isOpen}
        onClose={() => close(false)}
        triggerRef={triggerRef}
        align="end"
        label={strings.account}
        role="dialog"
        trapFocus
      >
        <div className={styles.panel}>
          <div className={styles.headline}>
            <span className={styles.headlineName}>{identity.name}</span>
            <span className={styles.headlineEmail}>{identity.email}</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.details}>
            <span className={styles.detail}>
              <span className={styles.detailLabel}>{strings.roles}</span>
              <span className={styles.detailValue}>{identity.roleSummary}</span>
            </span>
            {identity.homeRegion ? (
              <span className={styles.detail}>
                <span className={styles.detailLabel}>{strings.region}</span>
                <span className={styles.detailValue}>{identity.homeRegion}</span>
              </span>
            ) : null}
          </div>
          <div className={styles.divider} />
          <div className={styles.actions}>
            <Link className={styles.action} href="/profile" prefetch={false}
              onClick={() => close(false)}>
              <Icon name="identity" size="md" />
              {strings.profileSettings}
            </Link>
            <a className={styles.action} data-tone="danger" href="/signout">
              <Icon name="signOut" size="md" />
              {strings.signOut}
            </a>
          </div>
        </div>
      </MenuSurface>
    </div>
  );
}
