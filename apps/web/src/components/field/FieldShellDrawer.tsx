"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import ShellNavIcon from "@/components/ShellNavIcon";
import type { ShellIcon } from "@/lib/shell-navigation";

// SAQEEL field channel side panel — the burger and the drawer it opens.
// Geometry, tokens, class names and interaction behaviour are ported from the
// design authority designs/pwa/pwa/pwa-shell.js (WA-SHELL-r6); the drawer id
// `saqeel-primary-nav` matches the web shell so the two channels stay one
// vocabulary.
//
// SCOPE (Product Owner, 2026-07-26). The panel is available to EVERY persona on
// the field channel — the design authority's own rule ("burger AND sticky
// footer, both, for every role"), which the earlier CC-SHELL-TABLET-001 option B
// reading contradicted by mounting this only for a persona that was not
// field-only. The Product Owner resolved that contradiction in favour of the
// design. Per-destination restrictions are deferred to a later slice.
//
// `enabled` therefore means "this persona has at least one destination", not
// "this persona is allowed a side panel". It stays as a guard because a drawer
// with no rows is still an empty control, and no such control is presented.
//
// PLACEMENT. pwa-shell.js injects the button into the page's <header> from a
// standalone script. Doing that here — portalling a node into markup React owns
// — reliably broke hydration, because the field pages stream and React later
// reconciled the header against a first child it never rendered. So the burger
// is a real React child instead: FieldHeader renders <FieldShellBurger/>, which
// reads this context. Nothing mutates the DOM, the tab order is the DOM order,
// and the 23 field pages that use the shared header all get it for free.
//
// Groups arrive already built and filtered by the server from the canonical
// buildShellNavigation(); nothing is authored in this file. Visibility is
// presentation only — every destination keeps its route guard, RLS, action
// permission, workflow and audit enforcement.
export type FieldDrawerItem = { id: string; label: string; href: string; icon: ShellIcon };
export type FieldDrawerGroup = { id: string; label: string; items: FieldDrawerItem[] };
export type FieldShellStrings = { open: string; close: string; nav: string; brandAr: string };

type FieldShellContextValue = {
  enabled: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  strings: FieldShellStrings;
};

const FieldShellContext = createContext<FieldShellContextValue | null>(null);

// Rendered by FieldHeader as its first child. Returns nothing only when the
// persona has no side-panel destinations at all, so no empty control is ever
// presented.
export function FieldShellBurger() {
  const ctx = useContext(FieldShellContext);
  if (!ctx?.enabled) return null;
  return (
    <button
      type="button"
      className="pwa-shell-menu"
      aria-label={ctx.strings.open}
      aria-controls="saqeel-primary-nav"
      aria-expanded={ctx.open}
      onClick={() => ctx.setOpen(!ctx.open)}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  );
}

export default function FieldShellDrawer({
  groups, strings, children,
}: {
  groups: FieldDrawerGroup[];
  strings: FieldShellStrings;
  children: ReactNode;
}) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const enabled = groups.length > 0;

  // Route changes close the drawer; the destination is the point of opening it.
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); return; }
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!enabled) return;
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement | null;
      drawerRef.current?.querySelector<HTMLElement>("a[href],button:not([disabled])")?.focus();
    } else {
      lastFocus.current?.focus?.();
    }
  }, [enabled, open]);

  return (
    <FieldShellContext.Provider value={{ enabled, open, setOpen, strings }}>
      {children}
      {enabled ? (
        <>
          <button type="button" className="pwa-shell-backdrop" aria-label={strings.close}
            {...(open ? { "data-open": "" } : {})} onClick={() => setOpen(false)} />

          <nav ref={drawerRef} id="saqeel-primary-nav" className="pwa-shell-drawer"
            aria-label={strings.nav} {...(open ? { "data-open": "" } : {})}>
            <div className="pwa-shell-drawer__head">
              <span className="pwa-shell-drawer__lockup">
                <svg className="pwa-shell-drawer__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" />
                </svg>
                <span className="pwa-shell-drawer__brand">Inspection Platform</span>
                <span className="pwa-shell-drawer__brand-ar" lang="ar">{strings.brandAr}</span>
              </span>
              <button type="button" className="pwa-shell-close" aria-label={strings.close}
                onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="pwa-shell-drawer__scroll">
              {groups.map(group => (
                <div className="pwa-shell-group" key={group.id}>
                  <div className="pwa-shell-group__label">{group.label}</div>
                  {group.items.map(item => (
                    <Link key={item.id} className="pwa-shell-row" href={item.href} prefetch={false}
                      onClick={() => setOpen(false)}>
                      <span className="pwa-shell-row__icon"><ShellNavIcon name={item.icon} /></span>
                      <span className="pwa-shell-row__label">{item.label}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </nav>

          <style>{`
            .pwa-shell-menu {
              display: grid;
              place-items: center;
              inline-size: 38px;
              block-size: 38px;
              flex: 0 0 auto;
              border: 0;
              border-radius: 9px;
              background: transparent;
              color: inherit;
              cursor: pointer;
            }
            .pwa-shell-menu:hover { background: var(--nav-bg-hover); }
            .pwa-shell-menu:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

            .pwa-shell-backdrop {
              position: fixed;
              inset: 0;
              z-index: 70;
              border: 0;
              padding: 0;
              background: var(--nav-bg);
              opacity: 0;
              visibility: hidden;
              cursor: pointer;
              transition: opacity 180ms, visibility 180ms;
            }
            .pwa-shell-backdrop[data-open] { opacity: .55; visibility: visible; }

            .pwa-shell-drawer {
              position: fixed;
              z-index: 71;
              inset-block: 0;
              inset-inline-start: 0;
              inline-size: min(300px, 88vw);
              display: flex;
              flex-direction: column;
              background: var(--nav-bg);
              color: var(--nav-text);
              border-inline-end: 1px solid var(--nav-border);
              box-shadow: var(--shadow-lg);
              transform: translateX(-102%);
              transition: transform 220ms;
              padding-block-start: env(safe-area-inset-top);
            }
            [dir="rtl"] .pwa-shell-drawer { transform: translateX(102%); }
            .pwa-shell-drawer[data-open] { transform: translateX(0); }

            .pwa-shell-drawer__head {
              display: flex;
              align-items: center;
              gap: 10px;
              flex: none;
              padding: 14px 16px;
              border-block-end: 1px solid var(--nav-border);
            }
            .pwa-shell-drawer__lockup { display: flex; align-items: center; gap: 9px; min-inline-size: 0; }
            .pwa-shell-drawer__mark { inline-size: 22px; block-size: 22px; flex: none; color: var(--nav-indicator); }
            .pwa-shell-drawer__brand {
              font: 700 15px var(--font-body);
              letter-spacing: .14em;
              color: var(--nav-text-active);
            }
            .pwa-shell-drawer__brand-ar { font: 700 14px var(--font-body); color: var(--nav-text-active); }
            .pwa-shell-close {
              display: grid;
              place-items: center;
              inline-size: 34px;
              block-size: 34px;
              margin-inline-start: auto;
              border: 0;
              border-radius: 8px;
              background: transparent;
              color: var(--nav-text);
              cursor: pointer;
            }
            .pwa-shell-close:hover { background: var(--nav-bg-hover); }
            .pwa-shell-close:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

            /* Clears the persistent FieldNav tab bar, which is 56px and 60px from
               the 834px breakpoint (see FieldNav). */
            .pwa-shell-drawer__scroll {
              flex: 1;
              overflow-y: auto;
              overflow-x: hidden;
              padding: 10px 10px calc(14px + 56px + env(safe-area-inset-bottom));
            }
            @media (min-width: 834px) {
              .pwa-shell-drawer__scroll { padding-block-end: calc(14px + 60px + env(safe-area-inset-bottom)); }
            }
            .pwa-shell-group { margin-block-end: 12px; }
            .pwa-shell-group__label {
              font: 700 10.5px var(--font-body);
              letter-spacing: .08em;
              text-transform: uppercase;
              color: var(--nav-indicator);
              padding: 0 10px;
              margin-block-end: 4px;
            }
            .pwa-shell-row {
              display: flex;
              align-items: center;
              gap: 12px;
              min-block-size: 38px;
              padding: 0 10px;
              border-radius: 8px;
              text-decoration: none;
              color: var(--nav-text);
              font: 600 13px var(--font-body);
              overflow: hidden;
            }
            .pwa-shell-row:hover { background: var(--nav-bg-hover); color: var(--nav-text-active); }
            .pwa-shell-row:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
            .pwa-shell-row__icon {
              display: grid;
              place-items: center;
              inline-size: 20px;
              block-size: 20px;
              flex: none;
            }
            .pwa-shell-row__label {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              min-inline-size: 0;
            }
            @media (prefers-reduced-motion: reduce) {
              .pwa-shell-drawer, .pwa-shell-backdrop { transition: none; }
            }
          `}</style>
        </>
      ) : null}
    </FieldShellContext.Provider>
  );
}
