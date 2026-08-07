"use client";

import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import styles from "./segmented-control.module.css";

export type SegmentedOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly lang?: string;
};

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
  tone?: "subtle" | "accent";
  disabled?: boolean;
};

type TrackStyle = CSSProperties &
  Record<"--sqx-segment-count" | "--sqx-segment-index", string>;

const STEP: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowLeft: -1,
  ArrowDown: 1,
  ArrowUp: -1,
};

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  tone = "subtle",
  disabled,
}: SegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeIndex = Math.max(
    options.findIndex(option => option.value === value),
    0,
  );

  function focusSegment(index: number): void {
    const segments = trackRef.current?.querySelectorAll<HTMLButtonElement>("button");
    segments?.item(index)?.focus();
  }

  function select(index: number): void {
    const next = options[(index + options.length) % options.length];
    onChange(next.value);
    focusSegment((index + options.length) % options.length);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Home") {
      event.preventDefault();
      select(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      select(options.length - 1);
      return;
    }
    const step = STEP[event.key];
    if (step === undefined) return;
    event.preventDefault();
    select(activeIndex + step);
  }

  const style: TrackStyle = {
    "--sqx-segment-count": String(options.length),
    "--sqx-segment-index": String(activeIndex),
  };

  return (
    <div
      className={styles.root}
      ref={trackRef}
      role="radiogroup"
      aria-label={label}
      data-size={size}
      data-tone={tone}
      data-disabled={disabled ? "" : undefined}
      style={style}
      onKeyDown={onKeyDown}
    >
      <span className={styles.pill} aria-hidden="true" />
      {options.map((option, index) => (
        <button
          className={styles.segment}
          key={option.value}
          type="button"
          role="radio"
          lang={option.lang}
          aria-checked={option.value === value}
          tabIndex={index === activeIndex ? 0 : -1}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
