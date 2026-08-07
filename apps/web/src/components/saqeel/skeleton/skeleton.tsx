import { type ReactNode } from "react";
import styles from "./skeleton.module.css";

export type SkeletonWidth = "full" | "wide" | "half" | "narrow" | "tiny";

export function Skeleton({ shape = "line", width = "full", size = "md" }: {
  shape?: "line" | "block" | "pill" | "circle";
  width?: SkeletonWidth;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return <span className={styles.bone} data-shape={shape} data-width={width} data-size={size} />;
}

export function SkeletonText({ lines = 2, width = "full" }: {
  lines?: number;
  width?: SkeletonWidth;
}) {
  return (
    <span className={styles.lines}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} shape="line" width={index === lines - 1 ? "half" : width} size="sm" />
      ))}
    </span>
  );
}

export function SkeletonRegion({ label, children }: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.region} role="status" aria-busy="true" aria-live="polite">
      <span className="sqx-visually-hidden">{label}</span>
      <span className={styles.regionInner} aria-hidden="true">{children}</span>
    </div>
  );
}
