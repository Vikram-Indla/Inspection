"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Icon from "@/components/saqeel/icon/icon";
import styles from "./shell-mobile-nav.module.css";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

export default function ShellMobileNav({ children, strings }: {
  children: ReactNode;
  strings: Readonly<Record<"open" | "close" | "navigation", string>>;
}) {
  const drawerId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const drawer = drawerRef.current;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(drawer?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable();
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

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <button
        className={styles.trigger}
        type="button"
        ref={triggerRef}
        aria-label={strings.open}
        aria-controls={drawerId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <Icon name="openNavigation" size="md" />
      </button>

      <div className={styles.drawer} id={drawerId} data-open={isOpen ? "" : undefined} hidden={!isOpen}>
        <button
          className={styles.scrim}
          type="button"
          aria-label={strings.close}
          onClick={() => setIsOpen(false)}
        />
        <div className={styles.panel} ref={drawerRef} role="dialog" aria-modal="true" aria-label={strings.navigation}>
          <button
            className={styles.close}
            type="button"
            aria-label={strings.close}
            onClick={() => setIsOpen(false)}
          >
            <Icon name="dismiss" size="md" />
          </button>
          <div className={styles.content} onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
