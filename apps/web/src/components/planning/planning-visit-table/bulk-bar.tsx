"use client";

import Button from "@/components/saqeel/button/button";
import { Text } from "@/components/saqeel/type";
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
      <Text as="strong" role="label" numeric>{strings.selected.replace("{n}", String(count))}</Text>
      <Text as="span" tone="secondary">{strings.notConfigured}</Text>
      <span className={styles.spacer} />
      <Button size="sm" onClick={onClear}>{strings.clear}</Button>
    </div>
  );
}
