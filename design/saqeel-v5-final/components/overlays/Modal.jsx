import React, { useEffect, useId, useRef } from "react";

export function Modal({
  title,
  description,
  children,
  footer,
  onClose,
  closeOnBackdrop = true,
  labels = { close: "Close" },
  initialFocusRef,
  className = "",
}) {
  const id = useId();
  const dialogRef = useRef(null);
  const invokerRef = useRef(null);

  useEffect(() => {
    invokerRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusables = () => Array.from(dialog?.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
    ) ?? []);
    (initialFocusRef?.current ?? focusables()[0] ?? dialog)?.focus();

    const onKeyDown = event => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusables();
      if (!nodes.length) {
        event.preventDefault();
        dialog?.focus();
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
      document.body.style.overflow = previousOverflow;
      invokerRef.current?.focus?.();
    };
  }, [initialFocusRef, onClose]);

  return (
    <div
      className="ax-modal-backdrop"
      onMouseDown={event => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className={`ax-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        tabIndex={-1}
      >
        <div className="ax-modal__header">
          <h3 id={`${id}-title`}>{title}</h3>
          <button type="button" className="ax-btn ax-btn--subtle ax-btn--icon" aria-label={labels.close} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <div className="ax-modal__body">
          {description ? <p id={`${id}-description`} className="ax-caption">{description}</p> : null}
          {children}
        </div>
        {footer ? <div className="ax-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
