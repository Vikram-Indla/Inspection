"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import styles from "./menu-surface.module.css";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const MARGIN = 8;

const MIN_BLOCK_SIZE = 180;

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

  useIsomorphicLayoutEffect(() => {
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!open || !panel || !trigger) return;

    const place = () => {

      panel.dataset.align = align === "end" ? "end" : "start";
      panel.style.setProperty("--sqx-menu-shift", "0px");

      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const anchor = trigger.getBoundingClientRect();

      panel.style.setProperty(
        "--sqx-menu-avail-h",
        `${Math.max(MIN_BLOCK_SIZE, Math.round(vh - anchor.bottom - MARGIN * 2))}px`,
      );
      panel.style.setProperty("--sqx-menu-avail-w", `${vw - MARGIN * 2}px`);

      const initial = panel.getBoundingClientRect();
      const flipped = initial.right > vw - MARGIN || initial.left < MARGIN;
      if (flipped) panel.dataset.align = panel.dataset.align === "end" ? "start" : "end";
      const rect = flipped ? panel.getBoundingClientRect() : initial;

      const overflowEnd = rect.right - (vw - MARGIN);
      const overflowStart = MARGIN - rect.left;
      const shift = overflowEnd > 0 ? -overflowEnd : overflowStart > 0 ? overflowStart : 0;
      if (shift !== 0) panel.style.setProperty("--sqx-menu-shift", `${Math.round(shift)}px`);
    };

    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [align, open, triggerRef]);

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

  return (
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
    </div>
  );
}
