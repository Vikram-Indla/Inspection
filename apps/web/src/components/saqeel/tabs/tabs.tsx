"use client";

import { type KeyboardEvent } from "react";
import styles from "./tabs.module.css";

export type TabItem<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly count?: number;
  readonly lang?: string;
  readonly disabled?: boolean;
};

export type TabsProps<T extends string> = {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  idBase: string;
  size?: "sm" | "md";
};

const STEP: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowLeft: -1,
  ArrowDown: 1,
  ArrowUp: -1,
};

export function tabId(idBase: string, value: string): string {
  return `${idBase}-tab-${value}`;
}

export function tabPanelProps(idBase: string, activeValue: string) {
  return {
    role: "tabpanel" as const,
    id: `${idBase}-panel`,
    "aria-labelledby": tabId(idBase, activeValue),
    tabIndex: 0,
  };
}

export default function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idBase,
  size = "md",
}: TabsProps<T>) {
  function moveTo(list: HTMLElement, index: number): void {
    const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')];
    if (tabs.length === 0) return;
    const target = tabs[(index + tabs.length) % tabs.length];
    target.focus();
    if (target.dataset.value) onChange(target.dataset.value as T);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    const list = event.currentTarget.closest<HTMLElement>('[role="tablist"]');
    if (list === null) return;
    const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')];
    const current = tabs.findIndex(tab => tab.dataset.value === value);
    if (event.key === "Home") {
      event.preventDefault();
      moveTo(list, 0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      moveTo(list, tabs.length - 1);
      return;
    }
    const step = STEP[event.key];
    if (step === undefined) return;
    event.preventDefault();
    moveTo(list, current + step);
  }

  return (
    <div className={styles.list} role="tablist" aria-label={label} data-size={size}>
      {items.map(item => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            id={tabId(idBase, item.value)}
            type="button"
            role="tab"
            data-value={item.value}
            aria-selected={selected}
            aria-controls={`${idBase}-panel`}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            lang={item.lang}
            className={styles.tab}
            onClick={() => onChange(item.value)}
            onKeyDown={onKeyDown}
          >
            <span>{item.label}</span>
            {typeof item.count === "number" ? <span className={styles.count}>{item.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
