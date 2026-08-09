"use client";

import Button from "@/components/saqeel/button/button";
import styles from "./bulk-bar.module.css";

export type BulkBarStrings = {
  selected: string;
  clear: string;
  notConfigured: string;
};

export default function BulkBar({ count, strings, onClear }: {
  count: number;
  strings: BulkBarStrings;
  onClear: () => void;
}) {
  return (
    <div className={styles.root} role="status">
      <strong className={styles.count}>{strings.selected.replace("{n}", String(count))}</strong>
      <span className={styles.note}>{strings.notConfigured}</span>
      <span className={styles.spacer} />
      <Button size="sm" onClick={onClear}>{strings.clear}</Button>
    </div>
  );
}
