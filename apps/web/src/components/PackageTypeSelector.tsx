/**
 * Report-type / package single-select card group (Figma's "report type"
 * selector — تقرير زيارة / فسح كيميائي / إعفاء جمركي / تقرير سلامة / رصد تحدي —
 * IS the existing package_version_id field; this only reskins the plain
 * <select> as cards. Same field name, same value, same submission contract
 * (native radio inputs so uncontrolled/server-action forms keep working
 * unchanged), no new data or backend behavior.
 */
"use client";
import { useState } from "react";

export type PackageTypeOption = { id: string; code: string; title: string };

type PackageTypeSelectorProps = {
  name: string;
  options: PackageTypeOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  id?: string;
  labelledBy?: string;
};

export default function PackageTypeSelector({ name, options, value, defaultValue, onChange, id, labelledBy }: PackageTypeSelectorProps) {
  const [internal, setInternal] = useState(defaultValue ?? options[0]?.id ?? "");
  const selected = value ?? internal;
  function select(next: string) {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  }
  return (
    <div className="sq-typecards" role="radiogroup" id={id} aria-labelledby={labelledBy}>
      {options.map(opt => (
        <label key={opt.id} className={selected === opt.id ? "sq-typecard is-selected" : "sq-typecard"}>
          <input
            type="radio"
            name={name}
            value={opt.id}
            className="sq-sr-only"
            checked={selected === opt.id}
            onChange={() => select(opt.id)}
          />
          <span className="sq-typecard__title">{opt.title}</span>
          <span className="sq-typecard__meta numeric">{opt.code}</span>
        </label>
      ))}
    </div>
  );
}
