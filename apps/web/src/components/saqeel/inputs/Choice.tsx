"use client";
import React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  indeterminate?: boolean;
}

export function Checkbox({ label, indeterminate, ...rest }: CheckboxProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <label className="check">
      <input type="checkbox" ref={ref} {...rest} />
      {label && <span>{label}</span>}
    </label>
  );
}

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

export function Switch({ label, ...rest }: SwitchProps) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" {...rest} />
      {label && <span>{label}</span>}
    </label>
  );
}

type RadioOption = string | { value: string; label: string; help?: string; disabled?: boolean };

export interface RadioGroupProps {
  name: string;
  options?: RadioOption[];
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export function RadioGroup({ name, options = [], value, onChange, disabled }: RadioGroupProps) {
  return (
    <div className="stack" style={{ gap: "var(--space-2)" }} role="radiogroup">
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o, help: undefined, disabled: undefined } : o;
        return (
          <label className="radio" key={opt.value}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              disabled={disabled || opt.disabled}
              onChange={() => onChange && onChange(opt.value)}
            />
            <span>
              {opt.label}
              {opt.help && <div className="t-caption">{opt.help}</div>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
