"use client";

import Button from "@/components/saqeel/button/button";
import { Text } from "@/components/saqeel/type";
import styles from "./access-manager.module.css";

export type PendingChange = {
  readonly kind: "revokeRole" | "grantAdminRole" | "revokeCapability";
  readonly key: string;
};

export default function AccessConfirm({
  message, confirmLabel, cancelLabel, workingLabel, pending, onConfirm, onCancel,
}: {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  workingLabel: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!message) return null;

  return (
    <div className={styles.confirm} role="alertdialog" aria-label={message}>
      <Text as="span" role="bodyStrong">{message}</Text>
      <div className={styles.confirmActions}>
        <Button busy={pending} disabled={pending} onClick={onConfirm} variant="danger">
          {pending ? workingLabel : confirmLabel}
        </Button>
        <Button disabled={pending} onClick={onCancel} variant="secondary">
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
