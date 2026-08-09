import { type ReactNode } from "react";
import styles from "./definition-list.module.css";

export type Definition = {
  readonly label: string;
  readonly value: ReactNode;
};

export default function DefinitionList({ items, columns = "auto" }: {
  items: readonly Definition[];
  columns?: "auto" | "two";
}) {
  if (!items.length) return null;
  return (
    <dl className={styles.root} data-columns={columns}>
      {items.map(item => (
        <div className={styles.item} key={item.label}>
          <dt className={styles.term}>{item.label}</dt>
          <dd className={styles.value} dir="auto">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
