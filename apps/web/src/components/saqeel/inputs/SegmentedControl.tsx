"use client";
import React from "react";

export interface SegmentedControlProps {
  options?: Array<string | { value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
}

export function SegmentedControl({ options = [], value, onChange }: SegmentedControlProps) {
  return (
    <div className="seg" role="group">
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <button
            key={opt.value}
            type="button"
            className="seg-opt"
            aria-pressed={value === opt.value}
            onClick={() => onChange && onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
