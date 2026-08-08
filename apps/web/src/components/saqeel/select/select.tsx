"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import CountBadge from "../count-badge/count-badge";
import Icon from "../icon/icon";
import MenuSurface from "../menu-surface/menu-surface";
import MenuRow from "../menu-surface/menu-row";
import styles from "./select.module.css";

export type SelectOption = {
  readonly value: string;
  readonly label: string;
  readonly count?: number;
};

export type SelectProps = {
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  align?: "start" | "end";
};

export default function SaqeelSelect({
  options,
  value,
  onChange,
  label,
  placeholder,
  disabled,
  align = "start",
}: SelectProps) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedIndex = options.findIndex(option => option.value === value);
  const selected = selectedIndex < 0 ? undefined : options[selectedIndex];
  const optionId = (index: number) => `${listId}-${index}`;

  function open(startAt = selectedIndex < 0 ? 0 : selectedIndex): void {
    setActiveIndex(startAt);
    setIsOpen(true);
  }

  function close(returnFocus: boolean): void {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function commit(index: number): void {
    const option = options[index];
    if (option) onChange(option.value);
    close(true);
  }

  function typeAhead(key: string): void {
    const from = options.findIndex((option, index) =>
      index > activeIndex && option.label.toLowerCase().startsWith(key));
    const wrapped = from >= 0
      ? from
      : options.findIndex(option => option.label.toLowerCase().startsWith(key));
    if (wrapped >= 0) setActiveIndex(wrapped);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(index => Math.min(index + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(index => Math.max(index - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(activeIndex);
    } else if (event.key === "Tab") {
      close(false);
    } else if (event.key.length === 1) {
      typeAhead(event.key.toLowerCase());
    }
  }

  return (
    <div className={styles.root}>
      <button
        className={styles.trigger}
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-activedescendant={isOpen ? optionId(activeIndex) : undefined}
        disabled={disabled}
        onClick={() => (isOpen ? close(false) : open())}
        onKeyDown={onKeyDown}
      >
        <span className={styles.value} data-placeholder={selected ? undefined : ""}>
          {selected?.label ?? placeholder ?? label}
        </span>
        {selected && typeof selected.count === "number" ? <CountBadge value={selected.count} /> : null}
        <span className={styles.chevron}>
          <Icon name="disclosure" size="md" />
        </span>
      </button>

      <MenuSurface
        id={listId}
        open={isOpen}
        onClose={() => close(false)}
        triggerRef={triggerRef}
        align={align}
        label={label}
        role="listbox"
      >
        {options.map((option, index) => (
          <MenuRow
            key={option.value}
            id={optionId(index)}
            label={option.label}
            selected={option.value === value}
            active={index === activeIndex}
            count={option.count}
            onSelect={() => commit(index)}
          />
        ))}
      </MenuSurface>
    </div>
  );
}
