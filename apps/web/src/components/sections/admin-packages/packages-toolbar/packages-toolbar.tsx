import { type ReactNode } from "react";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import type { AdminPackagesMessages } from "@/features/admin-packages/strings";
import type { PackagesQuery } from "@/features/admin-packages/view";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import styles from "./packages-toolbar.module.css";

export default function PackagesToolbar({ query, matched, total, canWrite, strings, locale, actions }: {
  query: PackagesQuery;
  matched: number;
  total: number;
  canWrite: boolean;
  strings: AdminPackagesMessages;
  locale: Locale;
  actions: ReactNode;
}) {
  return (
    <div className={styles.toolbar}>
      <form action="/admin/packages" className={styles.search} method="get">
        {query.filter === "all" ? null : <input name="filter" type="hidden" value={query.filter} />}
        <TextInput
          defaultValue={query.search}
          label={strings.toolbar.search}
          name="q"
          placeholder={strings.toolbar.search}
          type="search"
        />
        <Button type="submit" variant="secondary">{strings.toolbar.searchAction}</Button>
      </form>

      <Text role="label" tone="secondary">
        {fill(strings.toolbar.showing, {
          matched: formatCount(matched, locale),
          total: formatCount(total, locale),
        })}
      </Text>

      <div className={styles.actions}>
        <StatusPill ping={false} tone={canWrite ? "success" : "neutral"}>
          {canWrite ? strings.toolbar.writer : strings.toolbar.reader}
        </StatusPill>
        {actions}
      </div>
    </div>
  );
}
