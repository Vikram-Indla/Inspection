"use client";

import { useState } from "react";
import { Mono, Text } from "@/components/saqeel/type";
import type { InspectionPackageOption } from "@/features/field-unregistered/queries";
import styles from "./unregistered.module.css";

export default function PackageTypeSelect({ name, options, labelledBy, onChange }: {
  name: string;
  options: readonly InspectionPackageOption[];
  labelledBy?: string;
  onChange?: (id: string) => void;
}) {
  const [selected, setSelected] = useState("");

  return (
    <div className={styles.packageGrid} role="radiogroup" aria-labelledby={labelledBy}>
      {options.map(option => (
        <label
          key={option.id}
          className={styles.packageCard}
          data-selected={selected === option.id ? "" : undefined}
        >
          <input
            type="radio"
            name={name}
            value={option.id}
            className="sqx-visually-hidden"
            checked={selected === option.id}
            onChange={() => { setSelected(option.id); onChange?.(option.id); }}
          />
          <Text role="bodyStrong" as="span" dir="auto">{option.title}</Text>
          <Mono as="span" tone="secondary">{option.code}</Mono>
        </label>
      ))}
    </div>
  );
}
