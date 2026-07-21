import React from "react";

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 14, style, ...rest }: SkeletonProps) {
  return (
    <span
      className="skeleton"
      style={{ display: "block", width, height, ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export interface ProgressProps {
  value?: number;
  max?: number;
  label?: string;
}

export function Progress({ value = 0, max = 100, label }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="stack" style={{ gap: "var(--space-1)" }}>
      {label && (
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="t-label">{label}</span>
          <span className="t-meta" style={{ fontVariantNumeric: "tabular-nums" }}>
            {Math.round(pct)}%
          </span>
        </div>
      )}
      <div
        className="progress"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <i style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}
