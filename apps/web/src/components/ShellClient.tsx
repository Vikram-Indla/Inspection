"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import NotificationBell, { type BellStrings } from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import { isShellRouteCurrent, type ShellIcon } from "@/lib/shell-navigation";

export type ShellClientNavGroup = {
  id: string;
  label: string;
  items: { id: string; label: string; href: string; icon: ShellIcon; businessTab: string }[];
};

export type ShellClientStrings = {
  primary: string;
  openMenu: string;
  closeMenu: string;
  collapse: string;
  expand: string;
  navigationSearch: string;
  searchResults: string;
  noSearchResults: string;
  account: string;
  roles: string;
  signOut: string;
  themeLight: string;
  themeDark: string;
  skipToContent: string;
};

function Icon({ name }: { name: ShellIcon }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<ShellIcon, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    radar: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6M12 3v2M21 12h-2"/></>,
    factory: <><path d="M3 21V9l6 3V9l6 3V5h6v16z"/><path d="M7 17h2M13 17h2M18 9h3"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/></>,
    visits: <><path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/></>,
    inspect: <><path d="M9 11l2 2 4-4"/><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></>,
    virtual: <><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M17 10l4-3v10l-4-3z"/></>,
    review: <><path d="M9 5h10v16H5V9z"/><path d="M9 5v4H5M9 14l2 2 4-4"/></>,
    admin: <><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12h6M12 9v6"/></>,
    library: <><path d="M4 4h6v16H4zM14 4h6v16h-6z"/><path d="M7 8h.01M17 8h.01"/></>,
    forms: <><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></>,
    enforcement: <><path d="M4 20h16M8 17l8-8M10 5l4 4M6 9l4 4"/></>,
    workflow: <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M17 8l-4 8M7 8l4 8"/></>,
    risk: <><path d="M12 3l10 18H2z"/><path d="M12 9v5M12 18h.01"/></>,
    map: <><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></>,
    access: <><circle cx="9" cy="8" r="4"/><path d="M3 21v-2a6 6 0 0112 0v2M17 11h4M19 9v4"/></>,
    notify: <><path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 004 0"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function initials(email: string) {
  const local = email.split("@")[0] || "S";
  return local.split(/[._-]+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "S";
}

export default function ShellClient({
  current, title, context, topbar, children, groups, strings, bellStrings,
  locale, languageHref, languageLabel, languageLang, email, roles,
}: {
  current: string;
  title: string;
  context?: ReactNode;
  topbar?: ReactNode;
  children: ReactNode;
  groups: ShellClientNavGroup[];
  strings: ShellClientStrings;
  bellStrings: BellStrings;
  locale: "ar" | "en";
  languageHref: string;
  languageLabel: string;
  languageLang: string;
  email: string;
  roles: string[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map(group => [group.id, true])),
  );
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("saqeel-shell-collapsed") === "1"); } catch { /* private mode */ }
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(navRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])') ?? []);
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setDrawerOpen(false); return; }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      menuRef.current?.focus();
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setAccountOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [accountOpen]);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    if (!normalized) return [];
    return groups.flatMap(group => group.items).filter(item => item.label.toLocaleLowerCase(locale).includes(normalized));
  }, [groups, locale, query]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("saqeel-shell-collapsed", next ? "1" : "0"); } catch { /* private mode */ }
  }

  function closeAfterNavigate() {
    setDrawerOpen(false);
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <div className={`ax-shell${collapsed ? " is-collapsed" : ""}${drawerOpen ? " is-drawer-open" : ""}`}>
      <a className="ax-shell__skip" href="#main-content">{strings.skipToContent}</a>
      <button className="ax-shell__backdrop" type="button" aria-label={strings.closeMenu} onClick={() => setDrawerOpen(false)} />
      <nav ref={navRef} id="saqeel-primary-nav" className="ax-shell__nav" aria-label={strings.primary}>
        <div className="ax-shell__brand">
          <img className="ax-shell__brand-mark" src="/saqeel-prism.svg" alt="" />
          <span className="ax-shell__brand-lockup">
            <span className="ax-shell__brand-wordmark" lang="ar">صقيل</span>
            <span className="ax-shell__brand-sub" lang="ar">صناعي</span>
          </span>
          <button className="ax-shell__close" type="button" aria-label={strings.closeMenu} onClick={() => setDrawerOpen(false)}>
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="ax-shell__groups">
          {groups.map(group => {
            const groupOpen = openGroups[group.id] ?? true;
            return (
              <section className="ax-nav-group" key={group.id}>
                <button className="ax-nav-group__trigger" type="button" aria-label={group.label} aria-expanded={groupOpen}
                  aria-controls={`nav-group-${group.id}`}
                  onClick={() => setOpenGroups(value => ({ ...value, [group.id]: !groupOpen }))}>
                  <span className="ax-nav-label">{group.label}</span><span className="ax-nav-group__chevron" aria-hidden="true">⌄</span>
                </button>
                <div id={`nav-group-${group.id}`} hidden={!groupOpen}>
                  {group.items.map(item => (
                    <Link key={item.href} className="ax-nav-item" aria-label={collapsed ? item.label : undefined} aria-current={isShellRouteCurrent(current, item.href) ? "page" : undefined}
                      href={item.href} title={collapsed ? item.label : undefined} onClick={closeAfterNavigate}>
                      <span className="ax-nav-icon"><Icon name={item.icon} /></span>
                      <span className="ax-nav-label">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <button className="ax-shell__collapse" type="button" onClick={toggleCollapsed} aria-label={collapsed ? strings.expand : strings.collapse} aria-expanded={!collapsed}>
          <span aria-hidden="true">‹</span><span className="ax-nav-label">{collapsed ? strings.expand : strings.collapse}</span>
        </button>
      </nav>

      <main id="main-content" className="ax-shell__main" tabIndex={-1}>
        <header className="ax-pagehead">
          <div className="ax-pagehead__topbar">
            <button ref={menuRef} className="ax-topbar-icon ax-shell__menu" type="button" aria-label={strings.openMenu}
              aria-controls="saqeel-primary-nav" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
              <span aria-hidden="true">☰</span>
            </button>
            {topbar ?? (
              <div className="ax-shell-search">
                <span className="ax-shell-search__icon" aria-hidden="true">⌕</span>
                <input value={query} aria-label={strings.navigationSearch} placeholder={strings.navigationSearch}
                  onFocus={() => setSearchOpen(true)} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }}
                  onKeyDown={event => { if (event.key === "Escape") { setSearchOpen(false); setQuery(""); } }} />
                {searchOpen && query && (
                  <div className="ax-shell-search__results" role="region" aria-label={strings.searchResults}>
                    {results.length ? results.map(item => (
                      <Link key={item.href} href={item.href} onClick={closeAfterNavigate}><Icon name={item.icon} /><span>{item.label}</span></Link>
                    )) : <p role="status">{strings.noSearchResults}</p>}
                  </div>
                )}
              </div>
            )}
            <div className="ax-pagehead__actions">
              <ThemeToggle className="ax-topbar-icon" labels={{ toLight: strings.themeLight, toDark: strings.themeDark }} />
              <NotificationBell strings={bellStrings} />
              <div ref={accountRef} className="ax-shell-account">
                <button className="ax-shell-account__trigger" type="button" aria-label={strings.account} aria-expanded={accountOpen}
                  onClick={() => setAccountOpen(value => !value)}>
                  <span className="ax-shell-account__avatar" aria-hidden="true">{initials(email)}</span>
                  <span className="ax-shell-account__identity"><strong>{email.split("@")[0]}</strong><small>{roles.join(" · ")}</small></span>
                  <span aria-hidden="true">⌄</span>
                </button>
                {accountOpen && (
                  <div className="ax-shell-account__menu" role="dialog" aria-label={strings.account}>
                    <strong>{email}</strong>
                    <span className="ax-caption">{strings.roles}: {roles.join(", ")}</span>
                    <a href={languageHref} lang={languageLang}>{languageLabel}</a>
                    <a href="/signout">{strings.signOut}</a>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="ax-pagehead__row">
            <div className="ax-pagehead__context"><h2>{title}</h2>{context}</div>
          </div>
        </header>
        <div className="ax-content">{children}</div>
      </main>
    </div>
  );
}
