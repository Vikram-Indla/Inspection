import { type ReactNode } from "react";
import styles from "./stack.module.css";

export default function Stack({ children, gap = "section", as = "div", label, labelledBy }: {
  children: ReactNode;
  gap?: "tight" | "default" | "loose" | "section";
  as?: "div" | "section" | "main";
  label?: string;
  labelledBy?: string;
}) {
  const Root = as;
  return (
    <Root className={styles.root} data-gap={gap} aria-label={label} aria-labelledby={labelledBy}>
      {children}
    </Root>
  );
}
