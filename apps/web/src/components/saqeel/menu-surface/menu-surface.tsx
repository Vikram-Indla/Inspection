"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import styles from "./menu-surface.module.css";

const OVERFLOW_GUARD = 12;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

type AnchorStyle = CSSProperties & Record<"--sqx-menu-anchor-w", string>;

export type MenuSurfaceProps = {
  id?: string;
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  anchorWidth?: number;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!open || !panel || !trigger) return;
    const measure = () => {
      const box = panel.getBoundingClientRect();
      const isRtl = getComputedStyle(panel).direction === "rtl";
      const room = isRtl ? box.right : window.innerWidth - box.left;
      panel.style.setProperty("--sqx-menu-avail", `${Math.max(room - OVERFLOW_GUARD, 0)}px`);
      panel.style.setProperty("--sqx-menu-anchor-w", `${trigger.getBoundingClientRect().width}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, triggerRef, children]);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!open || !node) return;
    const measure = () => setIsScrollable(node.scrollHeight > node.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, children]);

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
      data-align={align === "end" ? "end" : undefined}
      data-panel={role === "dialog" ? "" : undefined}
      data-scrollable={isScrollable ? "" : undefined}
      role={role}
      aria-label={label}
      style={style}
    >
      <div className={styles.scroll} ref={scrollRef}>
        {children}
      </div>
    </div>
  );
}
