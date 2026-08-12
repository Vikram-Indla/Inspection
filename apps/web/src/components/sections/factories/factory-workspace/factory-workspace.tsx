import { type ReactNode } from "react";
import styles from "./factory-workspace.module.css";

export default function FactoryWorkspace({ top, start, children, end, startLabel, endLabel }: {
  top?: ReactNode;
  start: ReactNode;
  children: ReactNode;
  end?: ReactNode;
  startLabel: string;
  endLabel: string;
}) {
  return (
    <div className={styles.root}>
      {top ? <div className={styles.top}>{top}</div> : null}
      <aside className={styles.start} aria-label={startLabel}>{start}</aside>
      <div className={styles.main}>{children}</div>
      {end ? <aside className={styles.end} aria-label={endLabel}>{end}</aside> : null}
    </div>
  );
}
