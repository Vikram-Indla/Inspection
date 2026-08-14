"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import CountBadge from "../count-badge/count-badge";
import Icon from "../icon/icon";
import type { IconName } from "../icon/icon-registry";
import MenuSurface from "../menu-surface/menu-surface";
import MenuRow from "../menu-surface/menu-row";
import styles from "./select.module.css";

export type SelectOption = {
  readonly value: string;
  readonly label: string;
  readonly count?: number;
  /**
   * Offered but not choosable. The row stays in the list and stays announced,
   * because "recorded but unavailable" and "never offered" are different facts
   * and a user can only act on the first if they can see it.
   */
  readonly disabled?: boolean;
  /** Short reason shown beside a disabled label. */
  readonly note?: string;
};

export type SelectProps = {
  options: readonly SelectOption[];
  label: string;
  /** Controlled value. Omit it and pass `defaultValue` to let the control own its state. */
  value?: string;
  /**
   * Initial value for an uncontrolled control. A form that is only read on
   * submit needs no state of its own — pair this with `name` and let `FormData`
   * carry the answer.
   */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /**
   * Submit name. A listbox is a `<button>`, which posts nothing, so the chosen
   * value rides along in a hidden input under this name — without it a server
   * action reading `FormData` receives an empty field.
   */
  name?: string;
  /**
   * Marks the control as required for assistive tech. A hidden input is exempt
   * from constraint validation, so the enforcing check belongs on the server.
   */
  required?: boolean;
  /**
   * Id for the trigger button. Pass it when an external `<label for>` names this
   * control — `aria-label` is then dropped so the visible label is the accessible
   * name rather than a second, unassociated copy of it.
   */
  id?: string;
  placeholder?: string;
  /**
   * Shown as a single unchoosable row when `options` is empty. Absent data is a
   * state, not a blank panel — without it an unconfigured lookup opens onto
   * nothing and the reader cannot tell it from a failure to load.
   */
  emptyLabel?: string;
  disabled?: boolean;
  /**
   * Leading glyph. Required to make `compact` legible — an icon-only trigger
   * showing a bare chevron names nothing.
   */
  icon?: IconName;
  /**
   * Render the trigger as its icon alone, for a toolbar with no room for the
   * label. The selected option moves into the accessible name rather than
   * disappearing, so the control still reports what it is filtering by.
   */
  compact?: boolean;
  align?: "start" | "end";
};

export default function SaqeelSelect({
  options,
  value,
  defaultValue,
  onChange,
  name,
  required,
  label,
  id,
  placeholder,
  emptyLabel,
  disabled,
  icon,
  compact = false,
  align = "start",
}: SelectProps) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ownValue, setOwnValue] = useState(defaultValue ?? "");

  const current = value ?? ownValue;
  const selectedIndex = options.findIndex(option => option.value === current);
  const selected = selectedIndex < 0 ? undefined : options[selectedIndex];
  const optionId = (index: number) => `${listId}-${index}`;

  function open(): void {
    setActiveIndex(selectedIndex < 0 ? edge(1) : selectedIndex);
    setIsOpen(true);
  }

  function close(returnFocus: boolean): void {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function commit(index: number): void {
    const option = options[index];
    if (!option || option.disabled) return;
    setOwnValue(option.value);
    onChange?.(option.value);
    close(true);
  }

  function step(from: number, direction: 1 | -1): number {
    for (let index = from + direction; index >= 0 && index < options.length; index += direction) {
      if (!options[index].disabled) return index;
    }
    return from;
  }

  function edge(direction: 1 | -1): number {
    const start = direction === 1 ? -1 : options.length;
    return step(start, direction);
  }

  function typeAhead(key: string): void {
    const matches = (option: SelectOption) =>
      !option.disabled && option.label.toLowerCase().startsWith(key);
    const from = options.findIndex((option, index) => index > activeIndex && matches(option));
    const wrapped = from >= 0 ? from : options.findIndex(matches);
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
      setActiveIndex(index => step(index, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(index => step(index, -1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(edge(1));
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(edge(-1));
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
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <button
        className={styles.trigger}
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        data-compact={compact ? "" : undefined}
        aria-label={id ? undefined : compact ? `${label} — ${selected?.label ?? placeholder ?? label}` : label}
        aria-required={required}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-activedescendant={isOpen ? optionId(activeIndex) : undefined}
        disabled={disabled}
        onClick={() => (isOpen ? close(false) : open())}
        onKeyDown={onKeyDown}
      >
        {icon ? <span className={styles.leading}><Icon name={icon} size="md" /></span> : null}
        <span className={styles.value} data-placeholder={selected ? undefined : ""}>
          {selected?.label ?? placeholder ?? label}
          {selected && typeof selected.count === "number" ? <CountBadge value={selected.count} superscript /> : null}
        </span>
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
        {options.length === 0 && emptyLabel
          ? <MenuRow id={optionId(0)} label={emptyLabel} selected={false} disabled onSelect={() => undefined} />
          : null}
        {options.map((option, index) => (
          <MenuRow
            key={option.value}
            id={optionId(index)}
            label={option.label}
            selected={option.value === current}
            active={index === activeIndex}
            count={option.count}
            disabled={option.disabled}
            note={option.note}
            onSelect={() => commit(index)}
          />
        ))}
      </MenuSurface>
    </div>
  );
}
