"use client";

import { type ReactNode } from "react";
import IconButton from "@/components/saqeel/icon-button/icon-button";
import { Heading, Overline } from "@/components/saqeel/type";
import styles from "./execution-dialog.module.css";

const openModally = (node: HTMLDialogElement | null) => {
  if (node && !node.open) node.showModal();
};

export default function ExecutionDialog({
  id, title, eyebrow, closeLabel, busy, onClose, footer, children,
}: {
  id: string;
  title: string;
  eyebrow: string;
  closeLabel: string;
  busy?: boolean;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <dialog className={styles.dialog} ref={openModally} onClose={onClose}
      aria-busy={busy} aria-labelledby={id}>
      <div className={styles.head}>
        <span className={styles.heading}>
          <Overline as="span" tone="muted">{eyebrow}</Overline>
          <Heading level={2} id={id}>{title}</Heading>
        </span>
        <IconButton icon="dismiss" label={closeLabel} onClick={onClose} />
      </div>
      <div className={styles.body}>{children}</div>
      {footer ? <div className={styles.foot}>{footer}</div> : null}
    </dialog>
  );
}
