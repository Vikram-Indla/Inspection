"use client";

import Button from "@/components/saqeel/button/button";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import Select from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import type { ExecutionLabels } from "@/features/execution/labels";
import type { ExecutionMessages } from "@/features/execution/strings";
import { FILTER_KEYS, type ExecutionFilters, type ExecutionView, type FilterKey } from "@/features/execution/types";
import styles from "./execution-toolbar.module.css";

export default function ExecutionToolbar({
  view, onViewChange, query, onQueryChange, filters, onFilterChange,
  options, active, onClear, viewStrings, filterStrings, labels,
}: {
  view: ExecutionView;
  onViewChange: (view: ExecutionView) => void;
  query: string;
  onQueryChange: (query: string) => void;
  filters: ExecutionFilters;
  onFilterChange: (key: FilterKey, value: string) => void;
  options: Record<FilterKey, string[]>;
  active: boolean;
  onClear: () => void;
  viewStrings: ExecutionMessages["view"];
  filterStrings: ExecutionMessages["filters"];
  labels: ExecutionLabels;
}) {
  const views: SegmentedItem<ExecutionView>[] = [
    { value: "mine", label: viewStrings.mine },
    { value: "all", label: viewStrings.all },
    { value: "map", label: viewStrings.map },
  ];

  return (
    <div className={styles.root}>
      <SegmentedControl items={views} value={view} label={viewStrings.label} onChange={onViewChange} />

      <div className={styles.controls}>
        <span className={styles.search}>
          <TextInput type="search" label={filterStrings.searchLabel} value={query}
            placeholder={filterStrings.searchPlaceholder} onChange={onQueryChange} />
        </span>

        {FILTER_KEYS.map(key => (
          <Select
            key={key}
            label={filterStrings[key]}
            value={filters[key] ?? ""}
            placeholder={filterStrings[key]}
            emptyLabel={filterStrings.any}
            onChange={value => onFilterChange(key, value)}
            options={[
              { value: "", label: filterStrings[key] },
              ...options[key].map(value => ({ value, label: labels.enumLabel(value) })),
            ]}
          />
        ))}

        {active ? (
          <Button variant="tertiary" size="sm" label={filterStrings.clear} onClick={onClear}>
            {filterStrings.clear}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
