import Link from "next/link";
import { type ReactNode } from "react";
import Icon from "../icon/icon";
import type { IconName } from "../icon/icon-registry";
import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger" | "ai" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconEnd?: IconName;
  block?: boolean;
  compactLabel?: boolean;
  disabled?: boolean;
  href?: string;
  prefetch?: boolean;
  type?: "button" | "submit" | "reset";
  /**
   * Submit name/value pair. A form with more than one outcome carries the
   * chosen one on the button that was pressed; without this a caller has to
   * split one decision into several forms, or bolt a hidden input onto each.
   * Ignored when the button renders as a link, which submits nothing.
   */
  name?: string;
  value?: string;
  title?: string;
  label?: string;
  expanded?: boolean;
  controls?: string;
  hasPopup?: "menu" | "dialog" | "listbox";
  onClick?: () => void;
};

export default function Button({
  children,
  variant = "secondary",
  size = "md",
  icon,
  iconEnd,
  block,
  compactLabel,
  disabled,
  href,
  prefetch = false,
  type = "button",
  name,
  value,
  title,
  label,
  expanded,
  controls,
  hasPopup,
  onClick,
}: ButtonProps) {
  const content = (
    <>
      {icon ? <Icon name={icon} size="md" /> : null}
      <span className={compactLabel ? styles.compact : styles.label}>{children}</span>
      {iconEnd ? <Icon name={iconEnd} size="md" /> : null}
    </>
  );

  const shared = {
    className: styles.root,
    "data-variant": variant,
    "data-size": size,
    "data-block": block ? "" : undefined,
    "aria-label": label,
    "aria-expanded": expanded,
    "aria-controls": controls,
    "aria-haspopup": hasPopup,
    title: title ?? label,
  } as const;

  if (href && !disabled) {
    return (
      <Link {...shared} href={href} prefetch={prefetch} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button {...shared} type={type} name={name} value={value} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  );
}
