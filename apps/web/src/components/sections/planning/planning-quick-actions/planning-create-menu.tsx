"use client";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import Icon from "@/components/saqeel/icon/icon";
import type { IconName } from "@/components/saqeel/icon/icon-registry";
import MenuSurface from "@/components/saqeel/menu-surface/menu-surface";
import styles from "./planning-quick-actions.module.css";

export type PlanningCreateMethod = "bulk" | "single" | "immediate";

export type PlanningCreateOption = {
  readonly key: PlanningCreateMethod;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly blockedReason?: string;
};

const METHOD_ICON: Record<PlanningCreateMethod, IconName> = {
  bulk: "workflow",
  single: "visits",
  immediate: "risk",
};

export default function PlanningCreateMenu({ label, options }: {
  label: string;
  options: readonly PlanningCreateOption[];
}) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const close = (returnFocus: boolean) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  return (
    <div className={styles.menuRoot}>
      <button
        className={styles.action}
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen(open => !open)}
      >
        <Icon name="calendar" size="sm" />
        <span className={styles.label}>{label}</span>
        <Icon name="disclosure" size="sm" />
      </button>

      <MenuSurface
        id={menuId}
        open={isOpen}
        onClose={() => close(false)}
        triggerRef={triggerRef}
        align="start"
        label={label}
        role="menu"
      >
        {options.map(option => option.blockedReason ? (
          <span key={option.key} className={styles.option} role="menuitem" aria-disabled="true">
            <Icon name="restricted" size="sm" />
            <span className={styles.optionText}>
              <span className={styles.optionTitle}>{option.title}</span>
              <span className={styles.optionNote}>{option.blockedReason}</span>
            </span>
          </span>
        ) : (
          <Link
            key={option.key}
            className={styles.option}
            href={option.href}
            role="menuitem"
            prefetch={false}
            onClick={() => close(false)}
          >
            <Icon name={METHOD_ICON[option.key]} size="sm" />
            <span className={styles.optionText}>
              <span className={styles.optionTitle}>{option.title}</span>
              <span className={styles.optionNote}>{option.description}</span>
            </span>
          </Link>
        ))}
      </MenuSurface>
    </div>
  );
}
