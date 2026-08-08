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
  onSelect: () => void;
};

export default function MenuRow({ id, label, selected, active, count, onSelect }: MenuRowProps) {
  return (
    <button
      className={styles.row}
      id={id}
      type="button"
      role="option"
      aria-selected={selected}
      data-active={active ? "" : undefined}
      tabIndex={-1}
      onClick={onSelect}
    >
      <span className={styles.check}>
        <Icon name="selected" size="md" />
      </span>
      <span className={styles.label}>{label}</span>
      {typeof count === "number" ? <CountBadge value={count} /> : null}
    </button>
  );
}
