"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import NotificationBell, { type BellStrings } from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import { isShellRouteCurrent, shellScopeForRoute, type ShellIcon } from "@/lib/shell-navigation";

export type ShellClientNavGroup = {
  id: string;
  label: string;
  items: {
    id: string; label: string; href: string; icon: ShellIcon; businessTab: string;
    enabled: boolean; disabledReason?: string; parentId?: string; parentLabel?: string;
  }[];
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
  searchLoading: string;
  searchUnavailable: string;
  dateScope: string;
  last30Days: string;
  from: string;
  to: string;
  apply: string;
  regionScope: string;
  allRegions: string;
  notApplicable: string;
  aiEntry: string;
  navigation: string;
  account: string;
  roles: string;
  profileSettings: string;
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
    insights: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/><path d="m3 6 6-3 6 5 7-6"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function initials(email: string) {
  const local = email.split("@")[0] || "S";
  return local.split(/[._-]+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "S";
}

type GlobalSearchResult = { id: string; type: "commercial_registration" | "industrial_license" | "plant" | "factory" | "visit" | "inspection"; label: string; detail: string; href: string };

function defaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  const format = (value: Date) => value.toISOString().slice(0, 10);
  return { from: format(from), to: format(to) };
}

export default function ShellClient({
  current, title, context, topbar, children, groups, strings, bellStrings,
  locale, languageHref, languageLabel, languageLang, email, roles, regions,
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
  regions: string[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [globalResults, setGlobalResults] = useState<GlobalSearchResult[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const initialDates = useMemo(defaultDateRange, []);
  const [dateFrom, setDateFrom] = useState(initialDates.from);
  const [dateTo, setDateTo] = useState(initialDates.to);
  const [regionScope, setRegionScope] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map(group => [group.id, true])),
  );
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("saqeel-shell-collapsed") === "1"); } catch { /* private mode */ }
    const params = new URLSearchParams(window.location.search);
    setDateFrom(params.get("from") ?? initialDates.from);
    setDateTo(params.get("to") ?? initialDates.to);
    setRegionScope(params.get("region") ?? "");
  }, []);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setGlobalResults([]);
      setSearchState("idle");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchState("loading");
      try {
        const response = await fetch(`/api/shell/search?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("search_unavailable");
        const payload = await response.json() as { results?: GlobalSearchResult[] };
        setGlobalResults(payload.results ?? []);
        setSearchState("ready");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setGlobalResults([]);
        setSearchState("error");
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query]);

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

  const navigationResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    if (!normalized) return [];
    return groups.flatMap(group => group.items).filter(item => item.enabled && item.label.toLocaleLowerCase(locale).includes(normalized));
  }, [groups, locale, query]);

  const routeScope = shellScopeForRoute(current);

  function replaceScope(updates: Record<string, string>) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(updates)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
  }

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

  function renderNavItem(item: ShellClientNavGroup["items"][number], child = false) {
    const className = `ax-nav-item${child ? " ax-nav-item--child" : ""}${item.enabled ? "" : " is-disabled"}`;
    if (!item.enabled) {
      const accessibleLabel = `${item.label}. ${item.disabledReason ?? ""}`.trim();
      return (
        <span key={item.id} className={className} role="link" aria-disabled="true" aria-label={accessibleLabel}
          title={`${item.label} — ${item.disabledReason ?? ""}`.trim()} tabIndex={0} data-nav-state="disabled">
          <span className="ax-nav-icon"><Icon name={item.icon} /></span>
          <span className="ax-nav-label">{item.label}</span>
          <span className="ax-nav-lock" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          </span>
          <span className="ax-sr-only">{item.disabledReason}</span>
        </span>
      );
    }
    return (
      <Link key={item.id} className={className} aria-label={collapsed ? item.label : undefined}
        aria-current={isShellRouteCurrent(current, item.href) ? "page" : undefined}
        href={item.href} title={item.label} onClick={closeAfterNavigate} data-nav-state="enabled"
        prefetch={false}>
        <span className="ax-nav-icon"><Icon name={item.icon} /></span>
        <span className="ax-nav-label">{item.label}</span>
      </Link>
    );
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
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
                  <span className="ax-nav-label">{group.label}</span><svg className="ax-nav-group__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
                </button>
                <div id={`nav-group-${group.id}`} hidden={!groupOpen}>
                  {group.items.map((item, index) => {
                    if (!item.parentId) return renderNavItem(item);
                    if (group.items.findIndex(candidate => candidate.parentId === item.parentId) !== index) return null;
                    const children = group.items.filter(candidate => candidate.parentId === item.parentId);
                    return (
                      <div className="ax-nav-subgroup" role="group" aria-labelledby={`nav-parent-${group.id}-${item.parentId}`} key={item.parentId}>
                        <div className="ax-nav-subgroup__label" id={`nav-parent-${group.id}-${item.parentId}`}>
                          <span className="ax-nav-icon"><Icon name={item.icon} /></span>
                          <span className="ax-nav-label">{item.parentLabel}</span>
                        </div>
                        {children.map(child => renderNavItem(child, true))}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <button className="ax-shell__collapse" type="button" onClick={toggleCollapsed} aria-label={collapsed ? strings.expand : strings.collapse} aria-expanded={!collapsed}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18 3 12l6-6M21 19V5" /></svg><span className="ax-nav-label">{collapsed ? strings.expand : strings.collapse}</span>
        </button>
      </nav>

      <main id="main-content" className="ax-shell__main" tabIndex={-1}>
        <header className="ax-pagehead">
          <div className="ax-pagehead__topbar">
            <button ref={menuRef} className="ax-topbar-icon ax-shell__menu" type="button" aria-label={strings.openMenu}
              aria-controls="saqeel-primary-nav" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            {topbar ?? (
              <div className="ax-shell-controls">
                <div className="ax-shell-search">
                  <span className="ax-shell-search__icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
                    </svg>
                  </span>
                  <input value={query} type="search" role="combobox" aria-autocomplete="list" aria-expanded={searchOpen && query.length >= 2}
                    aria-controls="shell-global-search-results" aria-label={strings.navigationSearch} placeholder={strings.navigationSearch}
                    onFocus={() => setSearchOpen(true)} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }}
                    onKeyDown={event => { if (event.key === "Escape") { setSearchOpen(false); setQuery(""); } }} />
                  {searchOpen && query.trim().length >= 2 && (
                    <div id="shell-global-search-results" className="ax-shell-search__results" role="listbox" aria-label={strings.searchResults}>
                      {navigationResults.map(item => (
                        <Link role="option" key={`nav-${item.id}`} href={item.href} onClick={closeAfterNavigate} prefetch={false}>
                          <Icon name={item.icon} /><span><strong>{item.label}</strong><small>{strings.navigation}</small></span>
                        </Link>
                      ))}
                      {globalResults.map(item => (
                        // F360IPAD-ENTRY-001 — on the inspector field channel, CR/license/plant
                        // search opens the field-native Factory 360 instead of the web dossier.
                        <Link role="option" key={`${item.type}-${item.id}`} href={current?.startsWith("/field") && item.href.startsWith("/factories/cr/") ? item.href.replace("/factories/cr/", "/field/factory-360/") : item.href} onClick={closeAfterNavigate} prefetch={false}>
                          <Icon name={item.type === "factory" ? "factory" : item.type === "visit" ? "visits" : "inspect"} />
                          <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                        </Link>
                      ))}
                      {searchState === "loading" ? <p role="status">{strings.searchLoading}</p> : null}
                      {searchState === "error" ? <p role="alert">{strings.searchUnavailable}</p> : null}
                      {searchState === "ready" && !navigationResults.length && !globalResults.length ? <p role="status">{strings.noSearchResults}</p> : null}
                    </div>
                  )}
                </div>
                {routeScope.date ? (
                  <details className="ax-shell-scope ax-shell-scope--date">
                    <summary aria-label={strings.dateScope} title={strings.dateScope}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
                      <span>{strings.last30Days}</span>
                    </summary>
                    <div className="ax-shell-scope__panel">
                      <label>{strings.from}<input type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} /></label>
                      <label>{strings.to}<input type="date" value={dateTo} onChange={event => setDateTo(event.target.value)} /></label>
                      <button type="button" className="ax-btn ax-btn--secondary" onClick={() => replaceScope({ from: dateFrom, to: dateTo })}>{strings.apply}</button>
                    </div>
                  </details>
                ) : (
                  <button className="ax-shell-scope is-disabled" type="button" disabled title={strings.notApplicable} aria-label={`${strings.dateScope}: ${strings.notApplicable}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
                    <span>{strings.last30Days}</span>
                  </button>
                )}
                <label className={`ax-shell-scope ax-shell-scope--region${routeScope.region && regions.length ? "" : " is-disabled"}`} title={!routeScope.region ? strings.notApplicable : regions.length ? undefined : strings.searchUnavailable}>
                  <span className="ax-sr-only">{strings.regionScope}</span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12z"/><circle cx="12" cy="9" r="2"/></svg>
                  <select aria-label={strings.regionScope} value={regionScope} disabled={!routeScope.region || !regions.length}
                    onChange={event => { setRegionScope(event.target.value); replaceScope({ region: event.target.value }); }}>
                    <option value="">{strings.allRegions}</option>
                    {regions.map(region => <option value={region} key={region}>{region}</option>)}
                  </select>
                </label>
              </div>
            )}
            <div className="ax-pagehead__actions">
              <ThemeToggle className="ax-topbar-icon" labels={{ toLight: strings.themeLight, toDark: strings.themeDark }} />
              <NotificationBell strings={bellStrings} />
              <Link className="ax-topbar-icon" href="/ai/suggestions" aria-label={strings.aiEntry} title={strings.aiEntry} prefetch={false}>
                <Icon name="insights" />
              </Link>
              <div ref={accountRef} className="ax-shell-account">
                <button className="ax-shell-account__trigger" type="button" aria-label={strings.account} aria-expanded={accountOpen}
                  onClick={() => setAccountOpen(value => !value)}>
                  <span className="ax-shell-account__avatar" aria-hidden="true">{initials(email)}</span>
                  <span className="ax-shell-account__identity"><strong>{email.split("@")[0]}</strong><small>{roles.join(" · ")}</small></span>
                  <svg className="ax-shell-account__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
                </button>
                {accountOpen && (
                  <div className="ax-shell-account__menu" role="dialog" aria-label={strings.account}>
                    <strong>{email}</strong>
                    <span className="ax-caption">{strings.roles}: {roles.join(", ")}</span>
                    <a href={languageHref} lang={languageLang}>{languageLabel}</a>
                    <a href="/profile">{strings.profileSettings}</a>
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
