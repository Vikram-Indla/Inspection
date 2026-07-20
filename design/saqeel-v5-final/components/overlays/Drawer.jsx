import React, { useEffect, useId, useRef } from "react";

export function Drawer({
  title,
  description,
  modal = false,
  children,
  onClose,
  labels = { close: "Close" },
  initialFocusRef,
  className = "",
}) {
  const id = useId();
  const drawerRef = useRef(null);
  const invokerRef = useRef(null);

  useEffect(() => {
    invokerRef.current = document.activeElement;
    const drawer = drawerRef.current;
    const focusables = () => Array.from(drawer?.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
    ) ?? []);
    (initialFocusRef?.current ?? focusables()[0] ?? drawer)?.focus();

    const onKeyDown = event => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (!modal || event.key !== "Tab") return;
      const nodes = focusables();
      if (!nodes.length) {
        event.preventDefault();
        drawer?.focus();
        return;
      }
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
      document.removeEventListener("keydown", onKeyDown);
      invokerRef.current?.focus?.();
    };
  }, [initialFocusRef, modal, onClose]);

  return (
    <aside
      ref={drawerRef}
      className={`ax-drawer ${className}`}
      role={modal ? "dialog" : "complementary"}
      aria-modal={modal || undefined}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      tabIndex={-1}
    >
      <div className="ax-drawer__header">
        <h3 id={`${id}-title`}>{title}</h3>
        <button type="button" className="ax-btn ax-btn--subtle ax-btn--icon" aria-label={labels.close} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
        </button>
      </div>
      {description ? <p id={`${id}-description`} className="ax-caption ax-drawer__description">{description}</p> : null}
      <div className="ax-drawer__body">{children}</div>
    </aside>
  );
}
