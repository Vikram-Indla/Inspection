"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import Icon from "@/components/saqeel/icon/icon";
import MenuSurface from "@/components/saqeel/menu-surface/menu-surface";
import { Text } from "@/components/saqeel/type";
import { localeHref, type Locale } from "@/lib/locale-path";
import type { ShellIdentity } from "@/features/shell/types";
import styles from "./shell-user-menu.module.css";

type UserMenuStrings = Readonly<Record<
  "account" | "roles" | "region" | "profileSettings" | "signOut",
  string
>>;

export default function ShellUserMenu({ identity, locale, strings }: {
  identity: ShellIdentity;
  locale: Locale;
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
        <span className={styles.avatar} aria-hidden="true">
          <Text as="span" role="bodyStrong" tone="accent">{identity.initials}</Text>
        </span>
        <span className={styles.identity}>
          <Text as="span" role="bodyStrong">{identity.name}</Text>
          <Text as="span" role="label" tone="muted">{identity.roleSummary}</Text>
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
            <Text as="span" role="bodyStrong">{identity.name}</Text>
            <span className={styles.headlineEmail}>
              <Text as="span" tone="muted">{identity.email}</Text>
            </span>
          </div>
          <div className={styles.divider} />
          <div className={styles.details}>
            <span className={styles.detail}>
              <Text as="span" role="label" tone="muted">{strings.roles}</Text>
              <span className={styles.detailValue}>
                <Text as="span" role="bodyStrong" tone="secondary">{identity.roleSummary}</Text>
              </span>
            </span>
            {identity.homeRegion ? (
              <span className={styles.detail}>
                <Text as="span" role="label" tone="muted">{strings.region}</Text>
                <span className={styles.detailValue}>
                  <Text as="span" role="bodyStrong" tone="secondary">{identity.homeRegion}</Text>
                </span>
              </span>
            ) : null}
          </div>
          <div className={styles.divider} />
          <div className={styles.actions}>
            <Link className={styles.action} href={localeHref(locale, "/profile")} prefetch={false}
              onClick={() => close(false)}>
              <Icon name="identity" size="md" />
              <Text as="span" role="label" tone="inherit">{strings.profileSettings}</Text>
            </Link>
            <a className={styles.action} data-tone="danger" href="/signout">
              <Icon name="signOut" size="md" />
              <Text as="span" role="label" tone="inherit">{strings.signOut}</Text>
            </a>
          </div>
        </div>
      </MenuSurface>
    </div>
  );
}
