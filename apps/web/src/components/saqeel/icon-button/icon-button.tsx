import { type ButtonHTMLAttributes, forwardRef } from "react";
import Icon from "../icon/icon";
import type { IconName } from "../icon/icon-registry";
import styles from "./icon-button.module.css";

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "style" | "children" | "aria-label"
>;

export type IconButtonProps = NativeButtonProps & {
  icon: IconName;
  label: string;
  size?: "sm" | "md" | "lg";
  pressed?: boolean;
  active?: boolean;
  mirrored?: boolean;
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, size = "md", pressed, active, mirrored, type = "button", ...native },
  ref,
) {
  return (
    <button
      {...native}
      ref={ref}
      type={type}
      className={styles.root}
      data-size={size === "md" ? undefined : size}
      data-active={active ? "" : undefined}
      aria-label={label}
      aria-pressed={pressed}
      title={native.title ?? label}
    >
      <Icon name={icon} size="md" mirrored={mirrored} />
    </button>
  );
});

export default IconButton;
