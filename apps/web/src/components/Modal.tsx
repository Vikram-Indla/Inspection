/**
 * Canonical accessible modal (Saqeel V5.1 §6 "Modal and drawer"). Wraps the
 * existing .ax-modal-backdrop/.ax-modal CSS with the behavior V1 call sites
 * were missing: focus trap while open, Escape to close, focus moves into the
 * dialog on open and returns to the trigger on close, and background scroll
 * is locked. Renders nothing when closed (no DOM/listener cost).
 */
"use client";
import { useEffect, useRef } from "react";
import { IconClose } from "@/app/icons";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: React.ReactNode;
  descriptionId?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeLabel: string;
};

export default function Modal({ open, onClose, titleId, title, descriptionId, description, children, footer, closeLabel }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ax-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="ax-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}>
        <div className="ax-modal__header ax-row" style={{ justifyContent: "space-between" }}>
          <h3 id={titleId} style={{ margin: 0 }}>{title}</h3>
          <button ref={closeBtnRef} type="button" className="ax-btn ax-btn--secondary ax-btn--icon" aria-label={closeLabel} onClick={onClose}>
            <IconClose size={16} />
          </button>
        </div>
        <div className="ax-modal__body">
          {description ? <p id={descriptionId} className="ax-caption">{description}</p> : null}
          {children}
        </div>
        {footer ? <div className="ax-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
