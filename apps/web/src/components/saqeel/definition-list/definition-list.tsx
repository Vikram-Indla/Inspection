import { type ReactNode } from "react";
import styles from "./definition-list.module.css";

export type Definition = {
  readonly label: string;
  readonly value: ReactNode;
};

// Label-over-value fact grid. Every detail surface in this app has been
// hand-rolling a <dl> with its own column rule and gap; this is the one
// grammar so they line up with each other and with the cards around them.
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
