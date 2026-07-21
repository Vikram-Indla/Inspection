import React from "react";
export function SegmentedControl({ options = [], value, onChange, ...rest }) {
  return (
    <div className="seg" role="group" {...rest}>
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <button key={opt.value} type="button" className="seg-opt" aria-pressed={value === opt.value}
            onClick={() => onChange && onChange(opt.value)}>{opt.label}</button>
        );
      })}
    </div>
  );
}