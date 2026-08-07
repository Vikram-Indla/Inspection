import { type ReactNode } from "react";
import styles from "./toolbar.module.css";

export default function Toolbar({ children, trailing, label, as = "div" }: {
  children: ReactNode;
  trailing?: ReactNode;
  label?: string;
  as?: "div" | "header" | "nav";
}) {
  const Root = as;
  return (
    <Root className={styles.root} aria-label={label}>
      <div className={styles.lead}>{children}</div>
      {trailing ? <div className={styles.trail}>{trailing}</div> : null}
    </Root>
  );
}
