"use client";

import { useState } from "react";
import Button from "@/components/saqeel/button/button";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import styles from "./access-manager.module.css";

export default function AccessGrantRow({
  options, label, actionLabel, emptyLabel, disabled, action,
}: {
  options: readonly SelectOption[];
  label: string;
  actionLabel: string;
  emptyLabel: string;
  disabled: boolean;
  action: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <div className={styles.grantRow}>
      <SaqeelSelect
        disabled={disabled || options.length === 0}
        emptyLabel={emptyLabel}
        label={label}
        onChange={setValue}
        options={options}
        placeholder={label}
        value={value}
      />
      <Button
        disabled={disabled || !value || options.length === 0}
        onClick={() => {
          action(value);
          setValue("");
        }}
        variant="primary"
      >
        {actionLabel}
      </Button>
    </div>
  );
}
