import { type ReactNode } from "react";
import styles from "./type.module.css";
import { type TextTone } from "./text";

export type MetricProps = {
  children: ReactNode;
  tone?: TextTone;
  unit?: ReactNode;
  describedBy?: string;
  id?: string;
};

export function Metric({ children, tone = "primary", unit, describedBy, id }: MetricProps) {
  return (
    <strong className={styles.metric} data-tone={tone} aria-describedby={describedBy} id={id}>
      {children}
      {unit ? <span className={styles.metricUnit}>{unit}</span> : null}
    </strong>
  );
}
