import Link from "next/link";
import { type CSSProperties, type KeyboardEvent } from "react";
import styles from "./segmented-control.module.css";

export type SegmentedItem<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly href?: string;
  readonly lang?: string;
};

export type SegmentedControlProps<T extends string> = {
  items: readonly SegmentedItem<T>[];
  value: T;
  label: string;
  onChange?: (value: T) => void;
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
  items,
  value,
  label,
  onChange,
  size = "md",
  tone = "subtle",
  disabled,
}: SegmentedControlProps<T>) {
  const navigates = items.every(item => typeof item.href === "string");
  const activeIndex = Math.max(items.findIndex(item => item.value === value), 0);
  const style: TrackStyle = {
    "--sqx-segment-count": String(items.length),
    "--sqx-segment-index": String(activeIndex),
  };

  function move(track: HTMLElement, index: number): void {
    const next = (index + items.length) % items.length;
    onChange?.(items[next].value);
    track.querySelectorAll<HTMLButtonElement>("button").item(next)?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const track = event.currentTarget;
    if (event.key === "Home") {
      event.preventDefault();
      move(track, 0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      move(track, items.length - 1);
      return;
    }
    const step = STEP[event.key];
    if (step === undefined) return;
    event.preventDefault();
    move(track, activeIndex + step);
  }

  const Root = navigates ? "nav" : "div";

  return (
    <Root
      className={styles.root}
      aria-label={label}
      role={navigates ? undefined : "radiogroup"}
      data-size={size}
      data-tone={tone}
      data-disabled={disabled ? "" : undefined}
      style={style}
      onKeyDown={onChange ? onKeyDown : undefined}
    >
      <span className={styles.pill} aria-hidden="true" />
      {items.map((item, index) => item.href ? (
        <Link
          className={styles.segment}
          key={item.value}
          href={item.href}
          lang={item.lang}
          prefetch={false}
          aria-current={item.value === value ? "page" : undefined}
        >
          {item.label}
        </Link>
      ) : (
        <button
          className={styles.segment}
          key={item.value}
          type="button"
          role="radio"
          lang={item.lang}
          aria-checked={item.value === value}
          tabIndex={index === activeIndex ? 0 : -1}
          disabled={disabled}
          onClick={() => onChange?.(item.value)}
        >
          {item.label}
        </button>
      ))}
    </Root>
  );
}
