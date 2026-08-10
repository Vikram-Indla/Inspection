"use client";

import CountBadge from "../count-badge/count-badge";
import Icon from "../icon/icon";
import styles from "./menu-surface.module.css";

export type MenuRowProps = {
  id: string;
  label: string;
  selected: boolean;
  active?: boolean;
  count?: number;
  /**
   * The option is shown but cannot be chosen. Stays in the list and stays
   * announced — an unavailable choice a user can see and understand is not the
   * same fact as one that was never offered.
   */
  disabled?: boolean;
  note?: string;
  onSelect: () => void;
};

export default function MenuRow({ id, label, selected, active, count, disabled, note, onSelect }: MenuRowProps) {
  return (
    <button
      className={styles.row}
      id={id}
      type="button"
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      data-active={active ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      tabIndex={-1}
      onClick={disabled ? undefined : onSelect}
    >
      <span className={styles.label}>
        {label}
        {typeof count === "number" ? <CountBadge value={count} superscript /> : null}
        {note ? <span className={styles.note}>{note}</span> : null}
      </span>
      <span className={styles.check}>
        <Icon name="selected" size="md" />
      </span>
    </button>
  );
}
