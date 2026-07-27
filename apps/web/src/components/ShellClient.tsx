"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import NotificationBell, { type BellStrings } from "@/components/NotificationBell";
import ShellNavIcon from "@/components/ShellNavIcon";
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
    enabled: boolean; badge?: number; disabledReason?: string; parentId?: string; parentLabel?: string;
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

const Icon = ShellNavIcon;

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
  const adminWorkspace = false;
  // The canonical Claude Design topbar always exposes the assistant entry.
  // Provider and route-level availability are enforced by the destination.
  const aiVisible = true;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [compactNavigation, setCompactNavigation] = useState(false);
  const [activeMobileAdminHub, setActiveMobileAdminHub] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [adminPaletteOpen, setAdminPaletteOpen] = useState(false);
  const [adminPaletteQuery, setAdminPaletteQuery] = useState("");
  const [globalResults, setGlobalResults] = useState<GlobalSearchResult[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const initialDates = useMemo(defaultDateRange, []);
  const [dateFrom, setDateFrom] = useState(initialDates.from);
  const [dateTo, setDateTo] = useState(initialDates.to);
  const [regionScope, setRegionScope] = useState("");
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  // The source design treats a compact/mobile drawer as fully expanded even
  // when the persisted desktop preference is collapsed. Keeping the raw
  // preference on the root leaked the desktop-only expand row into the drawer.
  const effectiveCollapsed = collapsed && !compactNavigation;
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
  const adminPaletteTriggerRef = useRef<HTMLButtonElement>(null);
  const adminPaletteInputRef = useRef<HTMLInputElement>(null);
  const adminPaletteRestoreRef = useRef<HTMLElement | null>(null);
  const [searchRect, setSearchRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("saqeel-shell-collapsed") === "1"); } catch { /* private mode */ }
    const params = new URLSearchParams(window.location.search);
    setDateFrom(params.get("from") ?? initialDates.from);
    setDateTo(params.get("to") ?? initialDates.to);
    setRegionScope(params.get("region") ?? "");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px), (pointer: coarse)");
    const update = () => setCompactNavigation(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!drawerOpen) setActiveMobileAdminHub(null);
  }, [drawerOpen]);

  // The persistent route-group layout survives navigation. Pathname changes
  // only after the destination commits, so this clears acknowledgement without
  // relying on a page-owned Shell prop (K-001 / K-006).
  useEffect(() => {
    setPendingHref(null);
  }, [current]);

  // A rejected RSC request or a development compile failure leaves the pathname
  // unchanged. Release the busy state in that negative path so the persistent
  // shell never appears frozen indefinitely.
  useEffect(() => {
    if (!pendingHref) return;
    const timer = window.setTimeout(() => setPendingHref(null), 10_000);
    return () => window.clearTimeout(timer);
  }, [pendingHref]);

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
    if (!adminWorkspace) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        adminPaletteRestoreRef.current = document.activeElement instanceof HTMLElement
          ? document.activeElement
          : adminPaletteTriggerRef.current;
        setAdminPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [adminWorkspace]);

  useEffect(() => {
    if (!adminPaletteOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => adminPaletteInputRef.current?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setAdminPaletteOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      (adminPaletteRestoreRef.current ?? adminPaletteTriggerRef.current)?.focus();
      adminPaletteRestoreRef.current = null;
    };
  }, [adminPaletteOpen]);

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

  const adminPaletteCopy = locale === "ar"
    ? {
        open: "فتح أدوات الإدارة",
        title: "الانتقال إلى أداة إدارية",
        search: "ابحث في أدوات الإدارة المصرح بها",
        results: (count: number) => `${count} نتيجة مصرح بها`,
        empty: "لا توجد أدوات مطابقة",
        close: "إغلاق",
      }
    : {
        open: "Open admin tools",
        title: "Go to an admin tool",
        search: "Search authorized admin tools",
        results: (count: number) => `${count} authorized ${count === 1 ? "result" : "results"}`,
        empty: "No matching tools",
        close: "Close",
      };
  const adminPaletteResults = useMemo(() => {
    const normalized = adminPaletteQuery.trim().toLocaleLowerCase(locale);
    return groups
      .filter(group => group.id.startsWith("admin-"))
      .flatMap(group => group.items.map(item => ({ ...item, hubLabel: group.label })))
      .filter(item =>
        !normalized
        || item.label.toLocaleLowerCase(locale).includes(normalized)
        || item.hubLabel.toLocaleLowerCase(locale).includes(normalized)
      );
  }, [adminPaletteQuery, groups, locale]);

  function closeAdminPalette() {
    setAdminPaletteOpen(false);
    setAdminPaletteQuery("");
  }

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

  function renderNavItem(
    item: ShellClientNavGroup["items"][number],
    child = false,
    showIcon = true,
  ) {
    const className = `ax-nav-item${child ? " ax-nav-item--child" : ""}${item.enabled ? "" : " is-disabled"}`;
    if (!item.enabled) {
      const accessibleLabel = `${item.label}. ${item.disabledReason ?? ""}`.trim();
      return (
        <span key={item.id} className={className} role="link" aria-disabled="true" aria-label={accessibleLabel}
          title={`${item.label} — ${item.disabledReason ?? ""}`.trim()} tabIndex={0} data-nav-state="disabled">
          {showIcon ? <span className="ax-nav-icon"><Icon name={item.icon} /></span> : null}
          <span className="ax-nav-label">{item.label}</span>
          {item.badge ? <span className="ax-badge ax-badge--critical ax-nav-badge">{item.badge}</span> : null}
          <span className="ax-nav-lock" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          </span>
          <span className="ax-sr-only">{item.disabledReason}</span>
        </span>
      );
    }
    return (
      <Link key={item.id} className={className} aria-label={effectiveCollapsed ? item.label : undefined}
        aria-current={isShellRouteCurrent(current, item.href) ? "page" : undefined}
        href={item.href} title={item.label} onClick={closeAfterNavigate} data-nav-state="enabled"
        data-next-spa="true" prefetch={false}>
        {showIcon ? <span className="ax-nav-icon"><Icon name={item.icon} /></span> : null}
        <span className="ax-nav-label">{item.label}</span>
        {item.badge ? <span className="ax-badge ax-badge--critical ax-nav-badge">{item.badge}</span> : null}
      </Link>
    );
  }

  function renderNavGroup(group: ShellClientNavGroup) {
    const groupOpen = openGroups[group.id] ?? true;
    const isAdministration = group.id === "administration";
    const groupActive = isAdministration
      && group.items.some(item => isShellRouteCurrent(current, item.href));
    return (
      <section className={`ax-nav-group${isAdministration ? " ax-nav-group--pinned" : ""}`} data-nav-group={group.id} key={group.id}>
        <button className={`ax-nav-group__trigger${isAdministration ? " is-administration" : ""}${groupActive ? " is-active" : ""}`} type="button" aria-label={group.label} aria-expanded={groupOpen}
          aria-controls={`nav-group-${group.id}`}
          data-current={groupActive ? "true" : undefined}
          onClick={() => setOpenGroups(value => ({ ...value, [group.id]: !groupOpen }))}>
          {isAdministration ? <span className="ax-nav-icon"><Icon name="admin" /></span> : null}
          <span className="ax-nav-label">{group.label}</span>
          <span className="ax-nav-group__chevron" aria-hidden="true">›</span>
        </button>
        <div id={`nav-group-${group.id}`} hidden={!groupOpen}>
          {group.items.map((item, index) => {
            if (isAdministration) return renderNavItem(item, true, false);
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

  function renderMobileAdminDiscovery() {
    const adminGroups = groups.filter(group => group.id.startsWith("admin-"));
    const activeHub = adminGroups.find(group => group.id === activeMobileAdminHub);
    if (activeHub) {
      return (
        <section className="ax-nav-group" data-mobile-admin-hub={activeHub.id}>
          <button className="ax-nav-group__trigger is-administration" type="button"
            aria-label={locale === "ar" ? "العودة إلى مجموعات الإدارة" : "Back to admin hubs"}
            onClick={() => setActiveMobileAdminHub(null)}>
            <span aria-hidden="true">{locale === "ar" ? "→" : "←"}</span>
            <span className="ax-nav-label">{locale === "ar" ? "رجوع" : "Back"}</span>
          </button>
          <h2 className="ax-nav-subgroup__label">{activeHub.label}</h2>
          {activeHub.items.map(item => renderNavItem(item))}
        </section>
      );
    }
    return (
      <div aria-label={locale === "ar" ? "مجموعات الإدارة" : "Admin hubs"}>
        {adminGroups.map(group => (
          <button className="ax-nav-group__trigger is-administration" type="button"
            key={group.id} aria-label={group.label}
            onClick={() => setActiveMobileAdminHub(group.id)}>
            <span className="ax-nav-icon"><Icon name="admin" /></span>
            <span className="ax-nav-label">{group.label}</span>
            <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`ax-shell${effectiveCollapsed ? " is-collapsed" : ""}${drawerOpen ? " is-drawer-open" : ""}${pendingHref ? " is-navigating" : ""}`}
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
          {/* The lockup is DOM text, not an <img> wordmark. saqeel web.html
              specifies a 34px mark beside a two-line name — Arabic leading,
              Latin as a spaced eyebrow — and that hierarchy only exists if the
              two scripts are separate elements. The previous
              saqeel-wordmark-dark-mode.svg carried live <text> inside an <img>,
              which is an isolated document: it cannot reach the page webfonts,
              so both scripts fell back to system faces and were forced onto one
              baseline. That is what made the wordmark sit wrong. */}
          <span className="ax-shell__brand-mark" aria-hidden="true">ص</span>
          <span className="ax-shell__brand-name">
            <span className="ax-shell__brand-ar" lang="ar">صقيل</span>
            <span className="ax-shell__brand-en" lang="en">SAQEEL</span>
          </span>
          <button className="ax-shell__close" type="button" aria-label={strings.closeMenu} onClick={() => setDrawerOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
          <button className="ax-shell__collapse" type="button" onClick={toggleCollapsed}
            aria-label={effectiveCollapsed ? strings.expand : strings.collapse}
            title={effectiveCollapsed ? strings.expand : strings.collapse}
            aria-controls="saqeel-primary-nav" aria-expanded={!effectiveCollapsed}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        </div>

        <div className="ax-shell__groups">
          {(adminWorkspace && compactNavigation && drawerOpen
            ? groups.filter(group => group.id !== "administration")
            : groups.filter(group => group.id !== "administration")
          ).map(renderNavGroup)}
        </div>
        <div className="ax-shell__nav-footer">
          {groups.filter(group => group.id === "administration").map(renderNavGroup)}
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
            </div> : (
              <div className="ax-pagehead__workspace-label">
                <span>{strings.primary}</span>
                <button ref={adminPaletteTriggerRef} type="button"
                  aria-label={`${adminPaletteCopy.open} (Ctrl/⌘ K)`}
                  aria-haspopup="dialog" aria-expanded={adminPaletteOpen}
                  onClick={() => {
                    adminPaletteRestoreRef.current = adminPaletteTriggerRef.current;
                    setAdminPaletteOpen(true);
                  }}>
                  {adminPaletteCopy.open} <kbd>⌘K</kbd>
                </button>
              </div>
            )}
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
                    <Link href="/profile" prefetch={false}>
                      {strings.profileSettings}
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

      {adminWorkspace && adminPaletteOpen && typeof document !== "undefined" && createPortal(
        <div role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) closeAdminPalette();
        }} style={{
          position: "fixed", inset: 0, zIndex: 10000, display: "grid",
          alignItems: "start", justifyItems: "center", padding: "min(12vh, 7rem) 1rem 1rem",
          background: "rgba(4, 9, 14, .72)", backdropFilter: "blur(4px)",
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="admin-palette-title"
            dir={locale === "ar" ? "rtl" : "ltr"}
            style={{
              inlineSize: "min(42rem, 100%)", maxBlockSize: "min(42rem, 78vh)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              border: "1px solid var(--sq-border, #39434d)", borderRadius: "1rem",
              background: "var(--sq-surface, #171c22)", color: "var(--sq-text, #f4f6f8)",
              boxShadow: "0 24px 80px rgba(0,0,0,.45)",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".75rem", padding: "1rem 1rem .75rem" }}>
              <strong id="admin-palette-title" style={{ flex: 1 }}>{adminPaletteCopy.title}</strong>
              <button type="button" aria-label={adminPaletteCopy.close} onClick={closeAdminPalette}>Esc</button>
            </div>
            <input ref={adminPaletteInputRef} type="search" value={adminPaletteQuery}
              aria-controls="admin-palette-results" aria-describedby="admin-palette-count"
              placeholder={adminPaletteCopy.search} aria-label={adminPaletteCopy.search}
              onChange={event => setAdminPaletteQuery(event.target.value)}
              style={{
                margin: "0 1rem .75rem", padding: ".8rem 1rem", borderRadius: ".65rem",
                border: "1px solid var(--sq-border, #39434d)",
                background: "var(--sq-surface-raised, #20262d)", color: "inherit",
              }} />
            <p id="admin-palette-count" role="status" aria-live="polite"
              style={{ margin: "0 1rem .5rem", color: "var(--sq-text-muted, #aab2bd)", fontSize: ".875rem" }}>
              {adminPaletteCopy.results(adminPaletteResults.length)}
            </p>
            <div id="admin-palette-results" role="listbox" aria-label={adminPaletteCopy.title}
              style={{ overflowY: "auto", padding: "0 .5rem 1rem" }}>
              {adminPaletteResults.map(item => (
                <Link key={item.id} role="option" href={item.href} data-next-spa="true" prefetch={false}
                  onClick={closeAdminPalette}
                  style={{
                    display: "flex", alignItems: "center", gap: ".75rem", padding: ".75rem",
                    borderRadius: ".6rem", color: "inherit", textDecoration: "none",
                  }}>
                  <span aria-hidden="true"><Icon name={item.icon} /></span>
                  <span style={{ display: "grid" }}>
                    <strong>{item.label}</strong>
                    <small style={{ color: "var(--sq-text-muted, #aab2bd)" }}>{item.hubLabel}</small>
                  </span>
                </Link>
              ))}
              {!adminPaletteResults.length ? (
                <p style={{ padding: "1rem", textAlign: "center", color: "var(--sq-text-muted, #aab2bd)" }}>
                  {adminPaletteCopy.empty}
                </p>
              ) : null}
            </div>
          </section>
        </div>,
        document.body,
      )}

    </div>
  );
}
