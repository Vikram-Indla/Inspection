"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import type { AdminPackagesMessages } from "@/features/admin-packages/strings";
import { packagesHref, type PackagesQuery } from "@/features/admin-packages/view";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import styles from "./packages-toolbar.module.css";

const SEARCH_DEBOUNCE_MS = 300;

export default function PackagesToolbar({ query, matched, total, canWrite, strings, locale }: {
  query: PackagesQuery;
  matched: number;
  total: number;
  canWrite: boolean;
  strings: AdminPackagesMessages;
  locale: Locale;
}) {
  const router = useRouter();
  const [searchPending, startSearchTransition] = useTransition();
  const [queryInput, setQueryInput] = useState(query.search);
  const isFirstSearchEffect = useRef(true);

  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }
    if (queryInput.trim() === query.search) return;
    const handle = setTimeout(() => {
      startSearchTransition(() => {
        router.replace(packagesHref({ filter: query.filter, search: queryInput.trim() }));
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [queryInput, query.search, query.filter, router]);

  return (
    <div className={styles.toolbar} aria-busy={searchPending}>
      <div className={styles.search}>
        <TextInput
          value={queryInput}
          label={strings.toolbar.search}
          placeholder={strings.toolbar.search}
          type="search"
          onChange={setQueryInput}
        />
      </div>

      <Text role="label" tone="secondary">
        {fill(strings.toolbar.showing, {
          matched: formatCount(matched, locale),
          total: formatCount(total, locale),
        })}
      </Text>

      <StatusPill ping={false} tone={canWrite ? "success" : "neutral"}>
        {canWrite ? strings.toolbar.writer : strings.toolbar.reader}
      </StatusPill>
    </div>
  );
}
