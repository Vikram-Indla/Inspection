"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import NotificationBell, { type BellStrings } from "@/components/NotificationBell";
import ShellNavIcon from "@/components/ShellNavIcon";
import ThemeToggle from "@/components/ThemeToggle";
import { isShellRouteCurrent, type ShellIcon } from "@/lib/shell-navigation";
import styles from "./admin-shell.module.css";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: ShellIcon;
  enabled: boolean;
  parentId?: string;
};

export default function AdminShellClient({
  children,
  items,
  locale,
  email,
  roles,
  languageHref,
  languageLabel,
  bellStrings,
  labels,
}: {
  children: ReactNode;
  items: NavItem[];
  locale: "ar" | "en";
  email: string;
  roles: string[];
  languageHref: string;
  languageLabel: string;
  bellStrings: BellStrings;
  labels: {
    navigation: string;
    controlPanel: string;
    advanced: string;
    collapse: string;
    expand: string;
    openMenu: string;
    closeMenu: string;
    light: string;
    dark: string;
    notifications: string;
    account: string;
    signOut: string;
    authorized: string;
  };
}) {
  const current = usePathname() || "/admin";
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("saqeel-admin-collapsed") === "1");
      setAdvancedOpen(localStorage.getItem("saqeel-admin-advanced") === "1");
    } catch {
      // Storage can be unavailable in private browsing. Runtime state still works.
    }
  }, []);

  useEffect(() => setDrawerOpen(false), [current]);

  const visibleItems = useMemo(() => items.filter(item => item.enabled), [items]);
  const primary = visibleItems.filter(item => !item.parentId && item.id !== "admin-home");
  const advanced = visibleItems.filter(item => item.parentId || item.id === "admin-home");
  const initials = email.split("@")[0]?.split(/[._-]+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "A";
  const roleSummary = roles.map(role => role.replaceAll("_", " ")).join(" · ");

  function setRailCollapsed(value: boolean) {
    setCollapsed(value);
    try { localStorage.setItem("saqeel-admin-collapsed", value ? "1" : "0"); } catch {}
  }

  function setAdvanced(value: boolean) {
    setAdvancedOpen(value);
    try { localStorage.setItem("saqeel-admin-advanced", value ? "1" : "0"); } catch {}
  }

  function navLink(item: NavItem) {
    const active = isShellRouteCurrent(current, item.href);
    return (
      <Link
        key={item.id}
        href={item.href}
        className={`${styles.navItem}${active ? ` ${styles.active}` : ""}`}
        aria-current={active ? "page" : undefined}
        prefetch={false}
      >
        <span className={styles.navIcon} aria-hidden="true"><ShellNavIcon name={item.icon} /></span>
        <span className={styles.navLabel}>{item.label}</span>
      </Link>
    );
  }

  return (
    <div className={`${styles.shell}${collapsed ? ` ${styles.collapsed}` : ""}${drawerOpen ? ` ${styles.drawerOpen}` : ""}`}>
      <a className={styles.skip} href="#main-content">{labels.navigation}</a>
      <aside className={styles.rail} aria-label={labels.navigation}>
        <div className={styles.brand}>
          <img className={styles.wordmark} src="/saqeel-wordmark-dark-mode.svg" alt="SAQEEL | صقيل" />
          <img className={styles.mark} src="/saqeel-favicon.svg" alt="" />
          <button
            type="button"
            className={styles.collapseButton}
            aria-label={collapsed ? labels.expand : labels.collapse}
            aria-expanded={!collapsed}
            onClick={() => setRailCollapsed(!collapsed)}
          >
            <span aria-hidden="true">{collapsed ? "→" : "←"}</span>
          </button>
          <button type="button" className={styles.closeButton} aria-label={labels.closeMenu} onClick={() => setDrawerOpen(false)}>×</button>
        </div>

        <nav className={styles.navigation}>
          <div className={styles.overline}>{labels.controlPanel}</div>
          <Link
            href="/admin"
            className={`${styles.navItem}${current === "/admin" ? ` ${styles.active}` : ""}`}
            aria-current={current === "/admin" ? "page" : undefined}
            prefetch={false}
          >
            <span className={styles.navIcon} aria-hidden="true"><ShellNavIcon name="admin" /></span>
            <span className={styles.navLabel}>{labels.controlPanel}</span>
          </Link>
          {primary.map(navLink)}

          {advanced.length ? (
            <div className={styles.advanced}>
              <button
                type="button"
                className={styles.advancedTrigger}
                aria-expanded={advancedOpen}
                onClick={() => setAdvanced(!advancedOpen)}
              >
                <span className={styles.navIcon} aria-hidden="true"><ShellNavIcon name="admin" /></span>
                <span className={styles.navLabel}>{labels.advanced}</span>
                <span className={styles.count}>{advanced.length}</span>
              </button>
              {advancedOpen ? <div className={styles.advancedList}>{advanced.map(navLink)}</div> : null}
            </div>
          ) : null}
        </nav>

        <div className={styles.scope}>
          <span className={styles.scopeRoles}>{roleSummary}</span>
          <small>{visibleItems.length} {labels.authorized}</small>
        </div>
      </aside>

      <button className={styles.backdrop} type="button" aria-label={labels.closeMenu} onClick={() => setDrawerOpen(false)} />

      <main id="main-content" className={styles.main} tabIndex={-1}>
        <header className={styles.utilityBar}>
          <button type="button" className={styles.menuButton} aria-label={labels.openMenu} aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
            <span aria-hidden="true">☰</span>
          </button>
          <span className={styles.utilitySpacer} />
          <Link className={styles.language} href={languageHref} lang={locale === "ar" ? "en" : "ar"}>{languageLabel}</Link>
          <ThemeToggle className={styles.utilityButton} labels={{ toLight: labels.light, toDark: labels.dark }} />
          <NotificationBell strings={bellStrings} locale={locale} fieldOnly={false} />
          <div className={styles.account}>
            <span className={styles.avatar} aria-hidden="true">{initials}</span>
            <span className={styles.accountCopy}>
              <strong>{email.split("@")[0]}</strong>
              <small>{roleSummary}</small>
            </span>
          </div>
          <Link className={styles.signOut} href="/signout" aria-label={labels.signOut}>{labels.signOut}</Link>
        </header>
        {children}
      </main>
    </div>
  );
}
