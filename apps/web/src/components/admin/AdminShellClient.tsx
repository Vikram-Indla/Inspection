"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
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
};

const HUB_ITEMS: Record<string, string[]> = {
  control: ["admin-home"],
  people: ["users", "roles", "security-access", "devices"],
  rules: ["surveys", "inspection-items", "lookups", "localization"],
  planning: ["planning-lookups", "planning-expiry", "planning-status", "execution", "workflows"],
  risk: ["risk"],
  connections: ["integrations", "gis"],
  governance: ["audit", "notifications", "platform-operations", "enforcement-recommendations", "bulk-violations", "enforcement-cases"],
};

const HUB_META: Record<string, { en: string; ar: string; icon: ShellIcon }> = {
  control: { en: "Control Panel", ar: "لوحة التحكم", icon: "admin" },
  people: { en: "People & Access", ar: "المستخدمون والصلاحيات", icon: "access" },
  rules: { en: "Rules & Content", ar: "القواعد والمحتوى", icon: "library" },
  planning: { en: "Planning & Execution", ar: "التخطيط والتنفيذ", icon: "calendar" },
  risk: { en: "Risk & Intelligence", ar: "المخاطر والذكاء", icon: "risk" },
  connections: { en: "Connections & Geography", ar: "الاتصالات والجغرافيا", icon: "workflow" },
  governance: { en: "Governance & Operations", ar: "الحوكمة والعمليات", icon: "radar" },
};

export default function AdminShellClient({
  children,
  items,
  locale,
  email,
  roles,
  languageLabel,
  bellStrings,
  labels,
}: {
  children: ReactNode;
  items: NavItem[];
  locale: "ar" | "en";
  email: string;
  roles: string[];
  languageLabel: string;
  bellStrings: BellStrings;
  labels: {
    navigation: string;
    controlPanel: string;
    collapse: string;
    expand: string;
    light: string;
    dark: string;
    signOut: string;
    authorized: string;
  };
}) {
  const current = usePathname() || "/admin";
  const [compact, setCompact] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const paletteInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { setCompact(localStorage.getItem("saqeel-admin-rail-compact") === "1"); } catch {}
  }, []);

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(value => !value);
      } else if (event.key === "Escape") {
        setPaletteOpen(false);
      }
    }
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    if (paletteOpen) requestAnimationFrame(() => paletteInput.current?.focus());
  }, [paletteOpen]);

  useEffect(() => {
    setPendingHref(null);
  }, [current]);

  useEffect(() => {
    if (!pendingHref) return;
    const timer = window.setTimeout(() => setPendingHref(null), 10_000);
    return () => window.clearTimeout(timer);
  }, [pendingHref]);

  const visibleItems = useMemo(() => items.filter(item => item.enabled), [items]);
  const hubs = useMemo(() => Object.entries(HUB_ITEMS).map(([id, ids]) => ({
    id,
    ...HUB_META[id],
    items: ids.map(itemId => visibleItems.find(item => item.id === itemId)).filter((item): item is NavItem => !!item),
  })).filter(hub => hub.items.length), [visibleItems]);
  const activeHub = hubs.find(hub => hub.items.some(item => isShellRouteCurrent(current, item.href))) ?? hubs[0];
  const paletteItems = hubs.flatMap(hub => hub.items.map(item => ({ item, hub }))).filter(({ item, hub }) =>
    `${item.label} ${locale === "ar" ? hub.ar : hub.en}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const initials = email.split("@")[0]?.split(/[._-]+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "A";
  const roleSummary = roles.map(role => role.replaceAll("_", " ")).join(" · ");

  function setRailCompact(value: boolean) {
    setCompact(value);
    try { localStorage.setItem("saqeel-admin-rail-compact", value ? "1" : "0"); } catch {}
  }

  function handleNavigationCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!anchor || anchor.target || anchor.download) return;
    const url = new URL(anchor.href, window.location.href);
    if (
      url.origin !== window.location.origin
      || url.pathname === "/signout"
      || (url.pathname === window.location.pathname && url.search === window.location.search && url.hash === window.location.hash)
    ) return;
    setPendingHref(`${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <div className={`${styles.shell}${compact ? ` ${styles.compact}` : ""}`} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}
      aria-busy={pendingHref ? "true" : undefined} onClickCapture={handleNavigationCapture}>
      {pendingHref ? (
        <div className={styles.routeProgress} role="status">
          <span className="ax-sr-only">{locale === "ar" ? "جارٍ تحميل الوجهة…" : "Loading destination…"}</span>
        </div>
      ) : null}
      <a className={styles.skip} href="#main-content">{labels.navigation}</a>
      <aside className={styles.rail} aria-label={labels.navigation}>
        <div className={styles.brand}>
          <img className={styles.wordmark} src="/saqeel-wordmark-dark-mode.svg" alt="SAQEEL | صقيل" />
          <img className={styles.mark} src="/saqeel-favicon.svg" alt="SAQEEL" />
          <button type="button" className={styles.collapseButton} aria-label={compact ? labels.expand : labels.collapse} aria-expanded={!compact} onClick={() => setRailCompact(!compact)}>
            <span aria-hidden="true">⇄</span>
          </button>
        </div>
        <button type="button" className={styles.findTool} aria-label={locale === "ar" ? "ابحث في الأدوات" : "Find a tool"} aria-keyshortcuts="Meta+K Control+K" onClick={() => setPaletteOpen(true)}>
          <span aria-hidden="true">⌕</span><span className={styles.findLabel}>{locale === "ar" ? "ابحث في الأدوات" : "Find a tool"}</span><kbd>⌘K</kbd>
        </button>
        <nav className={styles.hubs}>
          {hubs.map(hub => {
            const active = activeHub?.id === hub.id;
            return (
              <Link key={hub.id} href={hub.items[0].href} className={`${styles.hub}${active ? ` ${styles.active}` : ""}`} aria-label={locale === "ar" ? hub.ar : hub.en} aria-current={active ? "true" : undefined}>
                <span className={styles.hubIcon} aria-hidden="true"><ShellNavIcon name={hub.icon} /></span>
                <span className={styles.hubLabel}>{locale === "ar" ? hub.ar : hub.en}</span>
              </Link>
            );
          })}
        </nav>
        <Link className={styles.viewAll} href="/admin#all-tools">{locale === "ar" ? "عرض كل الأدوات المصرّح بها" : "View all authorized tools"}</Link>
      </aside>

      <main id="main-content" className={styles.main} tabIndex={-1}>
        <header className={styles.utilityBar}>
          <span className={styles.location}>{locale === "ar" ? activeHub?.ar : activeHub?.en}</span>
          <span className={styles.utilitySpacer} />
          <Link
            className={styles.language}
            href={`/locale?set=${locale === "ar" ? "en" : "ar"}`}
            hrefLang={locale === "ar" ? "en" : "ar"}
          >
            {languageLabel}
          </Link>
          <ThemeToggle className={styles.utilityButton} labels={{ toLight: labels.light, toDark: labels.dark }} />
          <NotificationBell strings={bellStrings} locale={locale} fieldOnly={false} />
          <details className={styles.account}>
            <summary>
              <span className={styles.avatar} aria-hidden="true">{initials}</span>
              <span className={styles.accountCopy}><strong>{email.split("@")[0]}</strong><small>{roleSummary}</small></span>
            </summary>
            <div className={styles.accountMenu}>
              <Link href="/signout">{labels.signOut}</Link>
            </div>
          </details>
        </header>

        {activeHub ? (
          <nav className={styles.subnav} aria-label={locale === "ar" ? activeHub.ar : activeHub.en}>
            <Link href="/admin" className={styles.subnavUp}>‹ <span>{locale === "ar" ? activeHub.ar : activeHub.en}</span></Link>
            <span className={styles.subnavRule} aria-hidden="true" />
            <div className={styles.subnavList}>
              {activeHub.items.map(item => {
                const active = isShellRouteCurrent(current, item.href);
                return <Link key={item.id} href={item.href} className={`${styles.subnavItem}${active ? ` ${styles.subnavActive}` : ""}`} aria-current={active ? "page" : undefined}>{item.label}</Link>;
              })}
            </div>
          </nav>
        ) : null}
        {children}
        {current === "/admin" ? (
          <details className={styles.toolDirectory} id="all-tools">
            <summary>{locale === "ar" ? "كل الأدوات المصرّح بها، مرتّبة حسب المجال" : "All authorized tools, grouped by area"}</summary>
            <div className={styles.toolGroups}>
              {hubs.map(hub => (
                <section key={hub.id}>
                  <h3>{locale === "ar" ? hub.ar : hub.en}</h3>
                  <div>{hub.items.map(item => <Link key={item.id} href={item.href}>{item.label}</Link>)}</div>
                </section>
              ))}
            </div>
          </details>
        ) : null}
      </main>

      {paletteOpen ? (
        <div className={styles.palette}>
          <button type="button" className={styles.paletteScrim} aria-label={locale === "ar" ? "إغلاق" : "Close"} onClick={() => setPaletteOpen(false)} />
          <div className={styles.paletteBox} role="dialog" aria-modal="true" aria-label={locale === "ar" ? "ابحث عن أداة" : "Find a tool"}>
            <input ref={paletteInput} className={styles.paletteInput} value={query} onChange={event => setQuery(event.target.value)} placeholder={locale === "ar" ? "ابحث عن أداة…" : "Find a tool…"} />
            <ul className={styles.paletteList}>
              {paletteItems.map(({ item, hub }) => (
                <li key={item.id}><Link href={item.href} onClick={() => setPaletteOpen(false)}><span>{item.label}</span><small>{locale === "ar" ? hub.ar : hub.en}</small></Link></li>
              ))}
            </ul>
            {!paletteItems.length ? <p className={styles.paletteEmpty}>{locale === "ar" ? "لا توجد أداة مصرح بها تطابق البحث." : "No authorized tool matches."}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
