"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import Button from "@/components/saqeel/button/button";
import Choice from "@/components/saqeel/choice/choice";
import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import type { ReviewsStrings } from "@/features/reviews/strings";
import type { QueueFilters, QueueOption } from "@/features/reviews/types";
import styles from "./review-filters.module.css";

export default function ReviewFilters({ filters, statusOptions, riskOptions, shown, total, strings }: {
  filters: QueueFilters;
  statusOptions: readonly QueueOption[];
  riskOptions: readonly QueueOption[];
  shown: number;
  total: number;
  strings: ReviewsStrings;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const write = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  const hasFilter = Boolean(filters.query || filters.status || filters.risk || filters.overdueOnly);

  return (
    <div className={styles.root}>
      <div className={styles.field}>
        <TextInput
          type="search"
          value={filters.query}
          onChange={value => write("q", value)}
          placeholder={strings.filters.search}
          label={strings.filters.searchAria}
        />
      </div>

      <SaqeelSelect
        options={[{ value: "", label: strings.filters.allStatuses }, ...statusOptions]}
        value={filters.status}
        onChange={value => write("status", value)}
        label={strings.filters.allStatuses}
        placeholder={strings.filters.allStatuses}
      />

      <SaqeelSelect
        options={[{ value: "", label: strings.filters.allRisks }, ...riskOptions]}
        value={filters.risk}
        onChange={value => write("risk", value)}
        label={strings.filters.allRisks}
        placeholder={strings.filters.allRisks}
        disabled={riskOptions.length === 0}
      />

      <Choice
        kind="checkbox"
        name="overdue"
        value="1"
        checked={filters.overdueOnly}
        onChange={checked => write("overdue", checked ? "1" : "")}
        label={strings.filters.overdueOnly}
      />

      {hasFilter ? (
        <Button variant="tertiary" size="sm" label={strings.filters.clear}
          onClick={() => router.replace(pathname, { scroll: false })}>
          {strings.filters.clear}
        </Button>
      ) : null}

      <span className={styles.count}>
        <Text role="label" tone="muted" as="span" numeric>
          {strings.filters.showing.replace("{shown}", String(shown)).replace("{total}", String(total))}
        </Text>
      </span>
    </div>
  );
}
