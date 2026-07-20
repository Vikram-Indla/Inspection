import React from "react";
export function RadioGroup({ name, options = [], value, onChange, disabled }) {
  return (
    <div className="stack" style={{ gap: "var(--space-2)" }} role="radiogroup">
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <label className="radio" key={opt.value}>
            <input type="radio" name={name} value={opt.value} checked={value === opt.value}
              disabled={disabled || opt.disabled} onChange={() => onChange && onChange(opt.value)} />
            <span>{opt.label}{opt.help && <div className="t-caption">{opt.help}</div>}</span>
          </label>
        );
      })}
    </div>
  );
}