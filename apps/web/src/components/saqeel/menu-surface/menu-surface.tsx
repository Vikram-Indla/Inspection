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

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

type AnchorStyle = CSSProperties & Record<"--sqx-menu-anchor-w" | "--sqx-menu-shift", string>;

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
  const [shift, setShift] = useState(0);

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

  useLayoutEffect(() => {
    if (!open) {
      setShift(0);
      return;
    }
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const margin = 8;
    const overflowEnd = rect.right - (window.innerWidth - margin);
    const overflowStart = margin - rect.left;
    setShift(overflowEnd > 0 ? -overflowEnd : overflowStart > 0 ? overflowStart : 0);
  }, [open]);

  if (!open) return null;

  const style: AnchorStyle = {
    "--sqx-menu-shift": `${shift}px`,
    ...(anchorWidth
      ? { "--sqx-menu-anchor-w": `${anchorWidth}px`, minInlineSize: `${anchorWidth}px` }
      : {}),
  } as AnchorStyle;

  return (
    <div
      className={styles.root}
      id={id}
      ref={panelRef}
      data-align={align === "end" ? "end" : undefined}
      role={role}
      aria-label={label}
      style={style}
    >
      {children}
    </div>
  );
}
