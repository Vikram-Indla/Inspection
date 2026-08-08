"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import styles from "./operations-timeline.module.css";

export type TimelinePickerStrings = {
  readonly label: string;
  readonly placeholder: string;
  readonly load: string;
};

// This was a native <select> inside a GET <form> posting back to /operations,
// which is why it rendered as an OS control while every other filter on the
// page used ours. Navigation is preserved exactly: the scope params ride along
// so loading a timeline never silently drops the active view, region or city.
export default function OperationsTimelinePicker({ options, value, scope, strings }: {
  options: readonly SelectOption[];
  value: string;
  scope: Readonly<Record<string, string>>;
  strings: TimelinePickerStrings;
}) {
  const router = useRouter();
  const [visitId, setVisitId] = useState(value);

  const load = () => {
    const params = new URLSearchParams(scope);
    if (visitId) params.set("timelineVisit", visitId);
    else params.delete("timelineVisit");
    const query = params.toString();
    router.push(query ? `/operations?${query}` : "/operations", { scroll: false });
  };

  return (
    <div className={styles.picker}>
      {/* SaqeelSelect's `label` is an accessible name only, so the visible
          label the native control had comes from Field. */}
      <Field label={strings.label}>
        <SaqeelSelect
          options={options}
          value={visitId}
          onChange={setVisitId}
          label={strings.label}
          placeholder={strings.placeholder}
        />
      </Field>
      <Button variant="secondary" onClick={load} label={strings.load}>
        {strings.load}
      </Button>
    </div>
  );
}
