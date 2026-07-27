"use client";

import Link from "next/link";
import {
  createContext,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
  useContext,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styles from "./AdminRecordDrawer.module.css";

export type AdminRecordDrawerLabels = {
  record: string;
  governance: string;
  audit: string;
  rule: string;
  editThroughRequest: string;
  viewActivityLog: string;
  close: string;
  closePanel: string;
  openRecord: string;
  auditDisclosure: string;
  editUnavailable: string;
};

export type AdminRecordField = {
  label: string;
  value: string;
};

export type AdminRecordDrawerData = {
  title: string;
  subtitle: string;
  record: readonly AdminRecordField[];
  governance: readonly string[];
  audit?: readonly AdminRecordField[];
  editHref?: string;
  editUnavailableReason?: string;
  auditHref: string;
};

const DrawerLabelsContext = createContext<AdminRecordDrawerLabels | null>(null);

export function AdminRecordDrawerProvider({
  labels,
  children,
}: {
  labels: AdminRecordDrawerLabels;
  children: ReactNode;
}) {
  return (
    <DrawerLabelsContext.Provider value={labels}>
      {children}
    </DrawerLabelsContext.Provider>
  );
}

function useDrawerLabels(): AdminRecordDrawerLabels {
  const labels = useContext(DrawerLabelsContext);
  if (!labels) {
    throw new Error("AdminRecordDrawer must be rendered inside AdminRecordDrawerProvider");
  }
  return labels;
}

function isInteractiveTarget(target: EventTarget | null, currentTarget: EventTarget): boolean {
  if (!(target instanceof HTMLElement) || target === currentTarget) return false;
  return Boolean(target.closest("a, button, input, select, textarea, summary, label, [contenteditable='true']"));
}

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(
    "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
  )).filter(element => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
}

function RecordDrawer({
  record,
  open,
  onClose,
  triggerRef,
}: {
  record: AdminRecordDrawerData;
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
}) {
  const labels = useDrawerLabels();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const subtitleId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = focusableElements(dialogRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1)!;
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
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [onClose, open, triggerRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.layer}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label={labels.closePanel}
        onClick={onClose}
      />
      <aside
        ref={dialogRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitleId}
        tabIndex={-1}
        data-admin-record-drawer
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 id={titleId}>{record.title}</h2>
            <p id={subtitleId}>{record.subtitle}</p>
          </div>
          <button
            ref={closeRef}
            className={styles.closeButton}
            type="button"
            onClick={onClose}
            aria-label={labels.close}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className={styles.body}>
          <DrawerGroup title={labels.record} fields={record.record} />
          <DrawerGroup
            title={labels.governance}
            fields={record.governance.map((value, index) => ({
              label: `${labels.rule} ${index + 1}`,
              value,
            }))}
          />
          <DrawerGroup
            title={labels.audit}
            fields={record.audit ?? []}
            disclosure={(record.audit?.length ?? 0) === 0 ? labels.auditDisclosure : undefined}
          />
        </div>

        <footer className={styles.actions}>
          {record.editHref ? (
            <Link className="sq-btn sq-btn--prominent" href={record.editHref} onClick={onClose}>
              {labels.editThroughRequest}
            </Link>
          ) : (
            <button
              className="sq-btn sq-btn--prominent"
              type="button"
              disabled
              aria-disabled="true"
              title={record.editUnavailableReason ?? labels.editUnavailable}
            >
              {labels.editThroughRequest}
            </button>
          )}
          <Link className="sq-btn" href={record.auditHref} onClick={onClose}>
            {labels.viewActivityLog}
          </Link>
          <button className="sq-btn" type="button" onClick={onClose}>
            {labels.close}
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}

function DrawerGroup({
  title,
  fields,
  disclosure,
}: {
  title: string;
  fields: readonly AdminRecordField[];
  disclosure?: string;
}) {
  return (
    <section className={styles.group}>
      <h3>{title}</h3>
      {fields.length > 0 ? (
        <dl>
          {fields.map((field, index) => (
            <div key={`${field.label}-${index}`}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {disclosure ? <p className={styles.disclosure}>{disclosure}</p> : null}
    </section>
  );
}

function useRecordDrawer(record: AdminRecordDrawerData) {
  const [open, setOpen] = useState(false);
  const labels = useDrawerLabels();
  const triggerRef = useRef<HTMLElement>(null);
  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);
  const onClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (!isInteractiveTarget(event.target, event.currentTarget)) openDrawer();
  };
  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDrawer();
    }
  };
  return { open, labels, triggerRef, openDrawer, closeDrawer, onClick, onKeyDown, record };
}

export function AdminRecordTableRow({
  record,
  children,
  className,
  id,
}: {
  record: AdminRecordDrawerData;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const drawer = useRecordDrawer(record);
  return (
    <>
      <tr
        ref={drawer.triggerRef as RefObject<HTMLTableRowElement>}
        id={id}
        className={`${styles.recordRow}${className ? ` ${className}` : ""}`}
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`${drawer.labels.openRecord}: ${record.title}`}
        onClick={drawer.onClick}
        onKeyDown={drawer.onKeyDown}
      >
        {children}
      </tr>
      <RecordDrawer
        record={record}
        open={drawer.open}
        onClose={drawer.closeDrawer}
        triggerRef={drawer.triggerRef}
      />
    </>
  );
}

export function AdminRecordArticle({
  record,
  children,
  className,
  id,
}: {
  record: AdminRecordDrawerData;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const drawer = useRecordDrawer(record);
  return (
    <>
      <article
        ref={drawer.triggerRef as RefObject<HTMLElement>}
        id={id}
        className={`${styles.recordArticle}${className ? ` ${className}` : ""}`}
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`${drawer.labels.openRecord}: ${record.title}`}
        onClick={drawer.onClick}
        onKeyDown={drawer.onKeyDown}
      >
        {children}
      </article>
      <RecordDrawer
        record={record}
        open={drawer.open}
        onClose={drawer.closeDrawer}
        triggerRef={drawer.triggerRef}
      />
    </>
  );
}
