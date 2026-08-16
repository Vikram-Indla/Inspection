import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Text } from "@/components/saqeel/type";
import type { LocalizationData } from "@/features/admin-localization/queries";
import type { AdminLocalizationMessages } from "@/features/admin-localization/strings";
import { localizationHref, type LocalizationQuery } from "@/features/admin-localization/view";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import LocalizationRow from "../localization-row/localization-row";
import styles from "./localization-registry.module.css";

export default function LocalizationRegistry({ data, query, strings, locale }: {
  data: LocalizationData;
  query: LocalizationQuery;
  strings: AdminLocalizationMessages;
  locale: Locale;
}) {
  if (!data.rows.length) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            description={query.search || query.filter !== "all" ? strings.empty.noMatchBody : strings.empty.body}
            icon="library"
            title={query.search || query.filter !== "all" ? strings.empty.noMatchTitle : strings.empty.title}
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader level="h2" title={strings.table.caption} />
      <CardBody>
        <div
          className={styles.registry}
          data-design-hash="11867bb534b7c318d7689b0300e6b59c485db8a5daab009a3c904851d222d91d"
          data-saqeel-design="WA-DES-010"
        >
        <div className={styles.headings} aria-hidden="true">
          <Text role="label" tone="secondary">{strings.table.source}</Text>
          <Text role="label" tone="secondary">{strings.table.translation}</Text>
          <Text role="label" tone="secondary">{strings.table.state}</Text>
        </div>

        <div className={styles.list}>
          {data.rows.map(row => (
            <LocalizationRow key={row.key} locale={locale} row={row} strings={strings} />
          ))}
        </div>

        {data.pageCount > 1 ? (
          <nav aria-label={strings.pagination.label} className={styles.pager}>
            <Button
              disabled={data.page <= 1}
              href={data.page > 1 ? localizationHref({ ...query, page: data.page - 1 }) : undefined}
              size="sm"
              variant="secondary"
            >
              {strings.pagination.previous}
            </Button>
            <Text role="label" tone="secondary">
              {fill(strings.pagination.page, {
                page: formatCount(data.page, locale),
                pageCount: formatCount(data.pageCount, locale),
              })}
            </Text>
            <Button
              disabled={data.page >= data.pageCount}
              href={data.page < data.pageCount ? localizationHref({ ...query, page: data.page + 1 }) : undefined}
              size="sm"
              variant="secondary"
            >
              {strings.pagination.next}
            </Button>
          </nav>
        ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
