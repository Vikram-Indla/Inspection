"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import FieldNav, { type FieldNavKey } from "@/components/field/FieldNav";
import NotificationBell, { type BellStrings } from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import {
  isFieldOnlyPersona,
  isShellRouteCurrent,
  shellGlobalSearchHref,
  shellScopeForRoute,
  type ShellGlobalSearchResultType,
  type ShellIcon,
} from "@/lib/shell-navigation";

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
  fieldSettings: string;
  signOut: string;
  themeLight: string;
  themeDark: string;
  skipToContent: string;
  loadingDestination: string;
  tabbar: { home: string; myTasks: string; establishments: string; notifications: string; account: string };
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
    admin: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/></>,
    library: <><path d="M4 4h6v16H4zM14 4h6v16h-6z"/><path d="M7 8h.01M17 8h.01"/></>,
    forms: <><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></>,
    enforcement: <><path d="M4 20h16M8 17l8-8M10 5l4 4M6 9l4 4"/></>,
    workflow: <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M17 8l-4 8M7 8l4 8"/></>,
    risk: <><path d="M12 3l10 18H2z"/><path d="M12 9v5M12 18h.01"/></>,
    map: <><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></>,
    access: <><circle cx="9" cy="8" r="4"/><path d="M3 21v-2a6 6 0 0112 0v2M17 11h4M19 9v4"/></>,
    notify: <><path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 004 0"/></>,
    ai: <>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" fill="currentColor" stroke="none"/>
      <path d="M19 3v2.5M20.25 4.25H17.75"/>
    </>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function initials(email: string) {
  const local = email.split("@")[0] || "S";
  return local.split(/[._-]+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "S";
}

type GlobalSearchResult = { id: string; type: ShellGlobalSearchResultType; label: string; detail: string; href: string };

function defaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  const format = (value: Date) => value.toISOString().slice(0, 10);
  return { from: format(from), to: format(to) };
}

export default function ShellClient({
  children, groups, strings, bellStrings,
  locale, languageHref, languageLabel, languageLang, email, roles, regions,
}: {
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
  const router = useRouter();
  const current = usePathname() || "/";
  const fieldOnly = isFieldOnlyPersona(roles);
  const adminWorkspace = current === "/admin" || current.startsWith("/admin/");
  const aiVisible = groups.some(group => group.items.some(item => item.enabled && item.href === "/ai/suggestions"));
  // Same precedence as the design's activeKey(): the more specific field
  // sections win, and anything else falls back to Home.
  const tabbarActive: FieldNavKey =
    current.startsWith("/field/my-tasks") ? "myTasks"
    : current.startsWith("/field/establishments") || current.startsWith("/field/factory-360") ? "establishments"
    : current.startsWith("/field/notifications") ? "notifications"
    : current.startsWith("/field/account") || current.startsWith("/field/settings") ? "account"
    : "home";
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
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map(group => [
      group.id,
      group.id === "admin-control"
        || group.items.some(item => isShellRouteCurrent(current, item.href))
        || (!group.id.startsWith("admin-") && group.id !== "administration"),
    ])),
  );
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [accountMenuPos, setAccountMenuPos] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const [searchRect, setSearchRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("saqeel-shell-collapsed") === "1"); } catch { /* private mode */ }
    const params = new URLSearchParams(window.location.search);
    setDateFrom(params.get("from") ?? initialDates.from);
    setDateTo(params.get("to") ?? initialDates.to);
    setRegionScope(params.get("region") ?? "");
  }, []);

  // The persistent route-group layout survives navigation. Pathname changes
  // only after the destination commits, so this clears acknowledgement without
  // relying on a page-owned Shell prop (K-001 / K-006).
  useEffect(() => {
    setPendingHref(null);
  }, [current]);

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
        setGlobalResults((payload.results ?? []).map(result => ({
          ...result,
          href: shellGlobalSearchHref(result, fieldOnly),
        })));
        setSearchState("ready");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setGlobalResults([]);
        setSearchState("error");
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [fieldOnly, query]);

  // The results panel portals to document.body (see render below) so it never
  // sits inside the sticky pagehead's compositing subtree, which reliably
  // failed to paint the results panel above later sibling content in that
  // header (DR-36/DR-51) regardless of z-index. Position is measured off the
  // search wrapper and kept in sync while the panel is open.
  const searchResultsOpen = searchOpen && query.trim().length >= 2;
  useEffect(() => {
    if (!searchResultsOpen) { setSearchRect(null); return; }
    const measure = () => {
      const rect = searchWrapRef.current?.getBoundingClientRect();
      if (rect) setSearchRect({ top: rect.bottom, left: rect.left, width: rect.width });
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [searchResultsOpen]);

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

  // Same DR-36/DR-51 sticky-pagehead compositing bug as the search dropdown
  // and notification popover — portals to document.body instead. Position is
  // measured off the trigger and kept in sync while open.
  useEffect(() => {
    if (!accountOpen) return;
    const measure = () => {
      const rect = accountRef.current?.getBoundingClientRect();
      if (!rect) return;
      const rtl = getComputedStyle(document.documentElement).direction === "rtl";
      setAccountMenuPos(rtl
        ? { top: rect.bottom + 8, left: rect.left }
        : { top: rect.bottom + 8, right: window.innerWidth - rect.right });
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    // The menu is portaled to document.body — no longer a DOM descendant of
    // accountRef — so a click inside the portaled menu must also count as
    // "inside", or every click there (e.g. "Sign out") closes it first.
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountRef.current?.contains(target)) return;
      if (accountMenuRef.current?.contains(target)) return;
      setAccountOpen(false);
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

  function handleShellNavigation(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target as Element;
    const anchor = target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor || anchor.target || anchor.download || anchor.getAttribute("rel")?.split(/\s+/).includes("external")) return;

    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname === "/signout" || url.pathname === "/login" || url.pathname === "/reset") return;
    if (
      url.pathname === window.location.pathname
      && url.search === window.location.search
      && url.hash === window.location.hash
    ) return;

    const href = `${url.pathname}${url.search}${url.hash}`;
    setPendingHref(href);
    // Let Next's own Link handler consume its prefetched RSC response. Raw
    // internal anchors fall through to the router so legacy screens still avoid
    // a document reload while they are migrated incrementally.
    if (anchor.dataset.nextSpa === "true") return;
    event.preventDefault();
    router.push(href);
  }

  function replaceScope(updates: Record<string, string>) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(updates)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    const href = `${url.pathname}${url.search}${url.hash}`;
    setPendingHref(href);
    // Client-router navigation (K-007): the page re-renders server-side with
    // the new searchParams; a full document reload is not needed.
    router.replace(href, { scroll: false });
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
        data-next-spa="true" prefetch={false}>
        <span className="ax-nav-icon"><Icon name={item.icon} /></span>
        <span className="ax-nav-label">{item.label}</span>
      </Link>
    );
  }

  function renderNavGroup(group: ShellClientNavGroup) {
    const groupOpen = openGroups[group.id] ?? true;
    const isAdministration = group.id.startsWith("admin-");
    return (
      <section className="ax-nav-group" data-nav-group={group.id} key={group.id}>
        <button className={`ax-nav-group__trigger${isAdministration ? " is-administration" : ""}`} type="button" aria-label={group.label} aria-expanded={groupOpen}
          aria-controls={`nav-group-${group.id}`}
          onClick={() => setOpenGroups(value => ({ ...value, [group.id]: !groupOpen }))}>
          {isAdministration ? <span className="ax-nav-icon"><Icon name="admin" /></span> : null}
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
                  <svg className="ax-nav-subgroup__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                </div>
                {children.map(child => renderNavItem(child, true))}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className={`ax-shell${collapsed ? " is-collapsed" : ""}${drawerOpen ? " is-drawer-open" : ""}${pendingHref ? " is-navigating" : ""}`}
      aria-busy={pendingHref ? "true" : undefined} onClickCapture={handleShellNavigation}>
      {pendingHref ? <div className="ax-route-progress" role="status"><span className="ax-sr-only">{strings.loadingDestination}</span></div> : null}
      <a className="ax-shell__skip" href="#main-content">{strings.skipToContent}</a>
      {/* Product-Owner decision (2026-07-26): the console shell is NOT
          persona-based. Every persona gets the same chrome — sidebar, drawer,
          hamburger, bell and account menu — at every width. What differs is the
          CONTENTS, which buildShellNavigation() still filters by role and
          channel (shell-navigation.ts), so a field persona's drawer holds only
          field-channel destinations. Same shell, role-appropriate items.
          Do not re-introduce a `fieldOnly` guard on this markup. */}
      <button className="ax-shell__backdrop" type="button" aria-label={strings.closeMenu} onClick={() => setDrawerOpen(false)} />
      <nav ref={navRef} id="saqeel-primary-nav" className="ax-shell__nav" aria-label={strings.primary}>
        <div className="ax-shell__brand">
          {/* WA-BRAND-r1 — canonical authenticated-shell identity. The design
              (SAQEEL Brand Identity Proof.dc.html) ships both marks in the
              markup and lets the shared rules decide which one shows:
              wordmark expanded, favicon collapsed, wordmark restored in the
              mobile drawer. Do not re-add the retired صقيل صناعي lockup. */}
          <img className="ax-shell__brand-lockup" src="/saqeel-wordmark-dark-mode.svg"
            alt="SAQEEL | صقيل" width={260} height={40} />
          <img className="ax-shell__brand-mark" src="/saqeel-favicon.svg"
            alt="SAQEEL" width={26} height={26} />
          <button className="ax-shell__close" type="button" aria-label={strings.closeMenu} onClick={() => setDrawerOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
          <button className="ax-shell__collapse" type="button" onClick={toggleCollapsed} aria-label={collapsed ? strings.expand : strings.collapse} aria-expanded={!collapsed}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        </div>

            <div className="ax-shell__groups">
              {groups.map(renderNavGroup)}
            </div>
      </nav>

      <main id="main-content" className="ax-shell__main" tabIndex={-1}>
        <header className="ax-pagehead">
          <div className="ax-pagehead__topbar">
            <button ref={menuRef} className="ax-topbar-icon ax-shell__menu" type="button" aria-label={strings.openMenu}
              aria-controls="saqeel-primary-nav" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            {!adminWorkspace ? <div className="ax-shell-controls">
                <div className="ax-shell-search" ref={searchWrapRef}>
                  <span className="ax-shell-search__icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
                    </svg>
                  </span>
                  <input value={query} type="search" role="combobox" aria-autocomplete="list" aria-expanded={searchOpen && query.length >= 2}
                    aria-controls="shell-global-search-results" aria-label={strings.navigationSearch} placeholder={strings.navigationSearch}
                    onFocus={() => setSearchOpen(true)} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }}
                    onKeyDown={event => { if (event.key === "Escape") { setSearchOpen(false); setQuery(""); } }} />
                  {searchResultsOpen && searchRect && typeof document !== "undefined" && createPortal(
                    <div id="shell-global-search-results" className="ax-shell-search__results ax-shell-search__results--portal" role="listbox"
                      aria-label={strings.searchResults}
                      style={{ top: searchRect.top, left: searchRect.left, width: searchRect.width }}>
                      {navigationResults.map(item => (
                        <Link role="option" key={`nav-${item.id}`} href={item.href} onClick={closeAfterNavigate} data-next-spa="true" prefetch={false}>
                          <Icon name={item.icon} /><span><strong>{item.label}</strong><small>{strings.navigation}</small></span>
                        </Link>
                      ))}
                      {globalResults.map(item => (
                        <Link role="option" key={`${item.type}-${item.id}`} href={item.href} onClick={closeAfterNavigate} data-next-spa="true" prefetch={false}>
                          <Icon name={item.type === "factory" ? "factory" : item.type === "visit" ? "visits" : "inspect"} />
                          <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                        </Link>
                      ))}
                      {searchState === "loading" ? <p role="status">{strings.searchLoading}</p> : null}
                      {searchState === "error" ? <p role="alert">{strings.searchUnavailable}</p> : null}
                      {searchState === "ready" && !navigationResults.length && !globalResults.length ? <p role="status">{strings.noSearchResults}</p> : null}
                    </div>,
                    document.body,
                  )}
                </div>
                {routeScope.date ? (
                  <details className="sq-shell-scope sq-shell-scope--date">
                    <summary aria-label={strings.dateScope} title={strings.dateScope}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
                      <span>{strings.last30Days}</span>
                    </summary>
                    <div className="sq-shell-scope__panel">
                      <label>{strings.from}<input type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} /></label>
                      <label>{strings.to}<input type="date" value={dateTo} onChange={event => setDateTo(event.target.value)} /></label>
                      <button type="button" className="sq-btn sq-btn--secondary" onClick={() => replaceScope({ from: dateFrom, to: dateTo })}>{strings.apply}</button>
                    </div>
                  </details>
                ) : (
                  <button className="sq-shell-scope is-disabled" type="button" disabled title={strings.notApplicable} aria-label={`${strings.dateScope}: ${strings.notApplicable}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
                    <span>{strings.last30Days}</span>
                  </button>
                )}
                <label className={`sq-shell-scope sq-shell-scope--region${routeScope.region && regions.length ? "" : " is-disabled"}`} title={!routeScope.region ? strings.notApplicable : regions.length ? undefined : strings.searchUnavailable}>
                  <span className="sq-sr-only">{strings.regionScope}</span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12z"/><circle cx="12" cy="9" r="2"/></svg>
                  <select aria-label={strings.regionScope} value={regionScope} disabled={!routeScope.region || !regions.length}
                    onChange={event => { setRegionScope(event.target.value); replaceScope({ region: event.target.value }); }}>
                    <option value="">{strings.allRegions}</option>
                    {regions.map(region => <option value={region} key={region}>{region}</option>)}
                  </select>
                </label>
            </div> : <div className="ax-pagehead__workspace-label">{strings.primary}</div>}
            <div className="ax-pagehead__actions">
              <ThemeToggle className="ax-topbar-icon" labels={{ toLight: strings.themeLight, toDark: strings.themeDark }} />
              {/* The bell renders for every persona (2026-07-26 ruling: one
                  shell for everybody). `fieldOnly` is still passed down because
                  it rewrites each notification's href onto the field channel —
                  that is routing, not chrome. */}
              <NotificationBell strings={bellStrings} locale={locale} fieldOnly={fieldOnly} />
              {aiVisible ? (
                <Link className="ax-topbar-icon" href="/ai/suggestions" aria-label={strings.aiEntry} title={strings.aiEntry} data-next-spa="true" prefetch={false}>
                  <Icon name="ai" />
                </Link>
              ) : null}
              <div ref={accountRef} className="ax-shell-account">
                <button className="ax-shell-account__trigger" type="button" aria-label={strings.account} aria-expanded={accountOpen}
                  onClick={() => setAccountOpen(value => !value)}>
                  <span className="sq-shell-account__avatar" aria-hidden="true">{initials(email)}</span>
                  <span className="sq-shell-account__identity"><strong>{email.split("@")[0]}</strong><small>{roles.join(" · ")}</small></span>
                  <svg className="sq-shell-account__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
                </button>
                {accountOpen && accountMenuPos && typeof document !== "undefined" && createPortal(
                  <div ref={accountMenuRef} className="ax-shell-account__menu ax-shell-account__menu--portal" role="dialog" aria-label={strings.account}
                    style={{ top: accountMenuPos.top, left: accountMenuPos.left, right: accountMenuPos.right }}>
                    <strong>{email}</strong>
                    <span className="sq-caption">{strings.roles}: {roles.join(", ")}</span>
                    {/* /locale and /signout are route handlers (cookie/session
                        mutations), so they intentionally stay plain anchors. */}
                    <a href={languageHref} lang={languageLang}>{languageLabel}</a>
                    {/* The menu itself is universal; only this destination stays
                        persona-aware, because an Inspector's settings live on
                        the field channel. Routing, not chrome. */}
                    <Link href={fieldOnly ? "/field/settings" : "/profile"} prefetch={false}>
                      {fieldOnly ? strings.fieldSettings : strings.profileSettings}
                    </Link>
                    <a href="/signout">{strings.signOut}</a>
                  </div>,
                  document.body,
                )}
              </div>
            </div>
          </div>
        </header>
        {children}
      </main>

      {/* Persistent tab bar — WA-PWA-TAB-r1 (designs/pwa/pwa/pwa-tabbar.js).
          The five tabs, their labels and their icons are the design's, not ours:
          Home / My Tasks / Establishments / Notifications / Account.

          Product-Owner decision (2026-07-26), CC-SHELL-TABLET-001 option B: the
          bar is FIELD navigation, so it is shown only to a field persona. An
          Operations or Leadership user on an iPad keeps the hamburger alone —
          they would otherwise be handed five tabs into routes their role cannot
          open. The access gate already routes a field persona to /field, where
          the field layout renders the bar, so in practice this branch is the
          narrow case of a field persona landing on a console route.

          Field routes are excluded here because field/layout.tsx renders the
          bar for the whole channel; rendering it again would double it. */}
      {!current.startsWith("/field") && fieldOnly && (
        <FieldNav consoleChannel active={tabbarActive} labels={strings.tabbar} />
      )}
    </div>
  );
}
