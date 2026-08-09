"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import styles from "./menu-surface.module.css";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Gap kept between the panel and the viewport edge.
const MARGIN = 8;
// A menu squeezed below this is worse than one that overlaps the fold.
const MIN_BLOCK_SIZE = 180;

// useLayoutEffect warns when it runs during SSR, and hooks run before the
// `open` early-return, so the isomorphic form is required rather than tidy.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type AnchorStyle = CSSProperties & Record<"--sqx-menu-anchor-w", string>;

export type MenuSurfaceProps = {
  id?: string;
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  anchorWidth?: number;
  /** Preferred edge. Overridden at open time if that edge would overflow. */
  align?: "start" | "end";
  label?: string;
  role?: "listbox" | "dialog" | "menu";
  trapFocus?: boolean;
  children: ReactNode;
};

export default function MenuSurface({
  id,
  open,
  onClose,
  triggerRef,
  anchorWidth,
  align = "start",
  label,
  role = "listbox",
  trapFocus = false,
  children,
}: MenuSurfaceProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Placement is measured, not assumed. Callers state a preference; if that
  // edge would push the panel off-screen it flips to the other edge, and if
  // neither edge fits it is nudged back inside. Height is capped to the real
  // gap below the trigger — a panel allowed to run past the viewport floor is
  // what produced a scrollbar on a menu that had room to sit open, and a
  // vertical scrollbar narrows the content box enough to trigger a horizontal
  // one too.
  useIsomorphicLayoutEffect(() => {
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!open || !panel || !trigger) return;

    const place = () => {
      panel.dataset.side = "below";

      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const anchor = trigger.getBoundingClientRect();
      const rtl = getComputedStyle(panel).direction === "rtl";

      panel.style.setProperty("--sqx-menu-anchor-w", `${Math.round(anchor.width)}px`);
      panel.style.setProperty("--sqx-menu-avail-w", `${vw - MARGIN * 2}px`);

      // Uncap first so scrollHeight reports what the content actually wants,
      // not what a previous placement already limited it to.
      const spaceBelow = Math.round(vh - anchor.bottom - MARGIN * 2);
      const spaceAbove = Math.round(anchor.top - MARGIN * 2);
      panel.style.setProperty("--sqx-menu-avail-h", `${vh}px`);
      const wanted = panel.scrollHeight;
      const openAbove = wanted > spaceBelow && spaceAbove > spaceBelow;

      panel.dataset.side = openAbove ? "above" : "below";
      const room = openAbove ? spaceAbove : spaceBelow;
      panel.style.setProperty("--sqx-menu-avail-h", `${Math.max(MIN_BLOCK_SIZE, room)}px`);

      // Block edge, measured from the viewport because the panel is fixed.
      const height = Math.min(panel.scrollHeight, Math.max(MIN_BLOCK_SIZE, room));
      const rawTop = openAbove ? anchor.top - MARGIN - height : anchor.bottom + MARGIN;
      const top = Math.max(MARGIN, Math.min(rawTop, vh - height - MARGIN));
      panel.style.setProperty("--sqx-menu-top", `${Math.round(top)}px`);

      // Inline edge. `inset-inline-start` resolves to the right edge in RTL, so
      // the offset is measured from whichever side that is — the value stays
      // logical and the same declaration serves both directions.
      // `end` is the inline end, which is the left edge in RTL — so the edge the
      // panel hangs from is the requested alignment XOR the direction.
      const width = Math.min(panel.scrollWidth, vw - MARGIN * 2);
      const hangFromRight = (align === "end") !== rtl;
      const physicalLeft = hangFromRight ? anchor.right - width : anchor.left;
      const clampedLeft = Math.max(MARGIN, Math.min(physicalLeft, vw - width - MARGIN));
      const start = rtl ? vw - clampedLeft - width : clampedLeft;
      panel.style.setProperty("--sqx-menu-start", `${Math.round(start)}px`);
    };

    place();
    const onScroll = () => place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [align, open, triggerRef]);

  // A portalled panel sits at the end of the body, so Tab from the trigger would
  // walk into the rest of the page instead of into the menu. A panel that traps
  // focus must therefore be given it — otherwise the trap has nothing to hold.
  useEffect(() => {
    if (!open || !trapFocus) return;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [open, trapFocus]);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (trigger?.contains(target)) return;
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        trigger?.focus();
        return;
      }
      if (event.key !== "Tab" || !trapFocus) return;
      const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open, trapFocus, triggerRef]);

  if (!open) return null;

  const style: AnchorStyle | undefined = anchorWidth
    ? { "--sqx-menu-anchor-w": `${anchorWidth}px`, minInlineSize: `${anchorWidth}px` }
    : undefined;

  // The panel is portalled to the body because the app shell's scrolling main
  // (`overflow-y: auto`) clips any absolutely-positioned descendant, and a card
  // that lifts on hover would otherwise become the containing block for a fixed
  // one. Neither z-index nor a placement flip can escape a clipping ancestor.
  return createPortal(
    <div
      className={styles.root}
      id={id}
      ref={panelRef}
      data-align={align === "end" ? "end" : "start"}
      role={role}
      aria-label={label}
      style={style}
    >
      {children}
    </div>,
    document.body,
  );
}
