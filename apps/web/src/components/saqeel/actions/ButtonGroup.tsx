import React from "react";
import { Button, type ButtonProps } from "./Button";

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function ButtonGroup({ children, className, ...rest }: ButtonGroupProps) {
  return (
    <div className={["btn-group", className].filter(Boolean).join(" ")} role="group" {...rest}>
      {children}
    </div>
  );
}

export interface SplitButtonProps {
  variant?: "primary" | "secondary" | "danger";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** opens the overflow menu (menu itself supplied by the consumer) */
  onMenu?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  menuLabel?: string;
  children?: React.ReactNode;
}

export function SplitButton({
  variant = "primary",
  children,
  onClick,
  onMenu,
  menuLabel = "More actions",
}: SplitButtonProps) {
  return (
    <div className="btn-group">
      <Button variant={variant as ButtonProps["variant"]} onClick={onClick}>
        {children}
      </Button>
      <Button
        variant={variant as ButtonProps["variant"]}
        iconOnly
        aria-label={menuLabel}
        onClick={onMenu}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        }
      />
    </div>
  );
}
