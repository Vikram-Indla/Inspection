import { type ReactNode } from "react";
import Button from "@/components/saqeel/button/button";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import type { AdminLocalizationMessages } from "@/features/admin-localization/strings";
import type { LocalizationQuery } from "@/features/admin-localization/view";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import styles from "./localization-toolbar.module.css";

export default function LocalizationToolbar({ query, matched, total, strings, locale, actions }: {
  query: LocalizationQuery;
  matched: number;
  total: number;
  strings: AdminLocalizationMessages;
  locale: Locale;
  actions: ReactNode;
}) {
  return (
    <div className={styles.toolbar}>
      <form action="/admin/localization" className={styles.search} method="get">
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

      <div className={styles.actions}>{actions}</div>
    </div>
  );
}
