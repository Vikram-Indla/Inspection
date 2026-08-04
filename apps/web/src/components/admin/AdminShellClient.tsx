"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import NotificationBell, { type BellStrings } from "@/components/NotificationBell";
import SaqeelBrandMark from "@/components/SaqeelBrandMark";
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

// Bucket ids/labels/icons here (HUB_META) come from the original hub-first
// nav design and are unchanged. What each bucket CONTAINS had to be
// recomputed: the "administration" catalogue in shell-navigation.ts was
// consolidated to 7 items (adm-users/adm-lookup/adm-risk/adm-survey/
// adm-notif/adm-delegation/adm-integration) and this map still pointed at
// the old ~25-item id set, so no item ever matched and every hub — hence
// the whole rail below "Find a tool" — silently rendered as empty. "control"
// and "planning" have no surviving item to hold and are dropped rather than
// left pointing at ids that no longer exist.
const HUB_ITEMS: Record<string, string[]> = {
  people: ["adm-users"],
  rules: ["adm-lookup", "adm-survey"],
  risk: ["adm-risk"],
  connections: ["adm-integration"],
  governance: ["adm-notif", "adm-delegation"],
};

const HUB_META: Record<string, { icon: ShellIcon }> = {
  people: { icon: "access" }, rules: { icon: "library" },
  risk: { icon: "risk" }, connections: { icon: "workflow" },
  governance: { icon: "radar" },
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
    loadingDestination: string;
    brandLabel: string;
    brandArabic: string;
    brandEnglish: string;
    findTool: string;
    viewAll: string;
    administration: string;
    allTools: string;
    close: string;
    paletteTitle: string;
    noMatch: string;
    hubs: Record<string, string>;
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
    label: labels.hubs[id],
    items: ids.map(itemId => visibleItems.find(item => item.id === itemId)).filter((item): item is NavItem => !!item),
  })).filter(hub => hub.items.length), [labels.hubs, visibleItems]);
  const paletteItems = hubs.flatMap(hub => hub.items.map(item => ({ item, hub }))).filter(({ item, hub }) =>
    `${item.label} ${hub.label}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
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
          <span className="sq-sr-only">{labels.loadingDestination}</span>
        </div>
      ) : null}
      <a className={styles.skip} href="#main-content">{labels.navigation}</a>
      <aside className={styles.rail} aria-label={labels.navigation}>
        <div className={styles.brand}>
          <SaqeelBrandMark className={styles.mark} />
          <span className={styles.wordmark} aria-label={labels.brandLabel}>
            <span lang="ar">{labels.brandArabic}</span>
            <span lang="en">{labels.brandEnglish}</span>
          </span>
          <button type="button" className={styles.collapseButton} aria-label={compact ? labels.expand : labels.collapse} aria-expanded={!compact} onClick={() => setRailCompact(!compact)}>
            <span aria-hidden="true">⇄</span>
          </button>
        </div>
        <button type="button" className={styles.findTool} aria-label={labels.findTool} aria-keyshortcuts="Meta+K Control+K" onClick={() => setPaletteOpen(true)}>
          <span aria-hidden="true">⌕</span><span className={styles.findLabel}>{labels.findTool}</span><kbd>⌘K</kbd>
        </button>
        {/* PO ruling (INSP-728 amendment): every manageable area must be
            listed here, always visible — not gated behind a hub click or
            the ⌘K palette. Each hub is a heading; every item under it is
            its own always-visible row. ⌘K (the findTool button above)
            stays as a secondary shortcut, not the only way to see what
            exists. */}
        <nav className={styles.hubs} aria-label={labels.administration}>
          {hubs.map(hub => (
            <Fragment key={hub.id}>
              <h3 className={styles.hubLabel}>{hub.label}</h3>
              {hub.items.map(item => {
                const active = isShellRouteCurrent(current, item.href);
                return (
                  <Link key={item.id} href={item.href} className={`${styles.hub}${active ? ` ${styles.active}` : ""}`} aria-current={active ? "page" : undefined}>
                    <span className={styles.hubIcon} aria-hidden="true"><ShellNavIcon name={item.icon} /></span>
                    <span className={styles.hubLabel}>{item.label}</span>
                  </Link>
                );
              })}
            </Fragment>
          ))}
        </nav>
        <Link className={styles.viewAll} href="/admin#all-tools">{labels.viewAll}</Link>
      </aside>

      <main id="main-content" className={styles.main} tabIndex={-1}>
        <header className={styles.utilityBar}>
          <button type="button" className={styles.collapseButton} aria-label={labels.expand} aria-expanded={compact} onClick={() => setRailCompact(true)}>
            <span aria-hidden="true">☰</span>
          </button>
          <span className={styles.location}>{labels.administration}</span>
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
            <summary aria-label={`${email.split("@")[0]} — ${roleSummary}`}>
              <span className={styles.avatar} aria-hidden="true">{initials}</span>
              <span className={styles.accountCopy}><strong>{email.split("@")[0]}</strong><small>{roleSummary}</small></span>
            </summary>
            <div className={styles.accountMenu}>
              <Link href="/signout">{labels.signOut}</Link>
            </div>
          </details>
        </header>

        {children}
        {current === "/admin" ? (
          <details className={styles.toolDirectory} id="all-tools">
            <summary>{labels.allTools}</summary>
            <div className={styles.toolGroups}>
              {hubs.map(hub => (
                <section key={hub.id}>
                  <h3>{hub.label}</h3>
                  <div>{hub.items.map(item => <Link key={item.id} href={item.href}>{item.label}</Link>)}</div>
                </section>
              ))}
            </div>
          </details>
        ) : null}
      </main>

      {paletteOpen ? (
        <div className={styles.palette}>
          <button type="button" className={styles.paletteScrim} aria-label={labels.close} onClick={() => setPaletteOpen(false)} />
          <div className={styles.paletteBox} role="dialog" aria-modal="true" aria-label={labels.paletteTitle}>
            <input ref={paletteInput} className={styles.paletteInput} value={query} onChange={event => setQuery(event.target.value)} placeholder={labels.findTool} />
            <ul className={styles.paletteList}>
              {paletteItems.map(({ item, hub }) => (
                <li key={item.id}><Link href={item.href} onClick={() => setPaletteOpen(false)}><span>{item.label}</span><small>{hub.label}</small></Link></li>
              ))}
            </ul>
            {!paletteItems.length ? <p className={styles.paletteEmpty}>{labels.noMatch}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
