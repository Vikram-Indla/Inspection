import { type ReactNode } from "react";
import styles from "./factory-dossier.module.css";

export default function FactoryDossier({ aside, screenId, children }: {
  aside: ReactNode;
  screenId?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.root} data-sqx-cards="flush" data-screen-id={screenId}>
      <aside className={styles.aside}>{aside}</aside>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
