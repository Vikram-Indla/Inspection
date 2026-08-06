"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/saqeel/icon/icon";
import type { ShellIdentity } from "@/features/shell/types";
import styles from "./shell-topbar.module.css";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  return (
    <div className={styles.user} ref={containerRef}>
      <button
        className={styles.userTrigger}
        type="button"
        ref={triggerRef}
        aria-label={`${identity.name} — ${identity.roleSummary}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        title={identity.email}
        onClick={() => setIsOpen(value => !value)}
      >
        <span className={styles.userAvatar} aria-hidden="true">{identity.initials}</span>
        <span className={styles.userIdentity}>
          <strong>{identity.name}</strong>
          <small>{identity.roleSummary}</small>
        </span>
        <Icon name="disclosure" size="sm" />
      </button>

      {isOpen ? (
        <div className={styles.userMenu} id={menuId} role="menu" aria-label={strings.account}>
          <p className={styles.userHeadline}>
            <strong>{identity.name}</strong>
            <small>{identity.email}</small>
          </p>
          <hr className={styles.userSeparator} />
          <p className={styles.userDetail}>
            <span>{strings.roles}</span>
            <span>{identity.roleSummary}</span>
          </p>
          {identity.homeRegion ? (
            <p className={styles.userDetail}>
              <span>{strings.region}</span>
              <span>{identity.homeRegion}</span>
            </p>
          ) : null}
          <hr className={styles.userSeparator} />
          <Link className={styles.userAction} role="menuitem" href="/profile" prefetch={false}
            onClick={() => setIsOpen(false)}>
            <Icon name="identity" size="sm" />
            {strings.profileSettings}
          </Link>
          <a className={styles.userAction} data-tone="danger" role="menuitem" href="/signout">
            <Icon name="signOut" size="sm" />
            {strings.signOut}
          </a>
        </div>
      ) : null}
    </div>
  );
}
