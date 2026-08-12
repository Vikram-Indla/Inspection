import { Card, CardBody, CardGrid, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { ListRow, ListRows } from "@/components/saqeel/list-row/list-row";
import type { FactoryRef, VisitRow } from "@/app/(app)/dashboard/metrics";
import { fill, getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./search-results.module.css";
import { Overline } from "@/components/saqeel/type";

const MAX_PER_GROUP = 6;
const ID_PREVIEW = 8;

type InspectionMatch = {
  readonly id: string;
  readonly visits: { factories: FactoryRef | null } | null;
};

type ResultGroup = {
  readonly key: string;
  readonly heading: string;
  readonly rows: readonly { id: string; href: string; title: string; detail: string }[];
};

export default function SearchResults({ locale, query, factories, visits, inspections }: {
  locale: Locale;
  query: string;
  factories: readonly FactoryRef[];
  visits: readonly VisitRow[];
  inspections: readonly InspectionMatch[];
}) {
  const { common, dashboard } = getMessages(locale);
  const needle = query.trim().toLocaleLowerCase(locale);
  if (!needle) return null;

  const matches = (...values: readonly (string | null | undefined)[]) =>
    values.some(value => value?.toLocaleLowerCase(locale).includes(needle));
  const join = (...parts: readonly (string | null | undefined)[]) =>
    parts.filter(Boolean).join(" · ");

  const groups: ResultGroup[] = [
    {
      key: "factories",
      heading: common.entity.factories,
      rows: factories
        .filter(row => matches(row.name, row.factory_code, row.region, row.city))
        .slice(0, MAX_PER_GROUP)
        .map(row => ({
          id: row.id,
          href: localeHref(locale, `/factories/${row.id}`),
          title: row.name,
          detail: join(row.factory_code, row.region, row.city),
        })),
    },
    {
      key: "visits",
      heading: common.entity.visits,
      rows: visits
        .filter(row => matches(row.id, row.factories?.name, row.factories?.factory_code))
        .slice(0, MAX_PER_GROUP)
        .map(row => ({
          id: row.id,
          href: localeHref(locale, `/visits/${row.id}`),
          title: row.factories?.name ?? dashboard.search.visitFallback,
          detail: join(row.id.slice(0, ID_PREVIEW), row.operational_state),
        })),
    },
    {
      key: "inspections",
      heading: common.entity.inspections,
      rows: inspections
        .filter(row => matches(row.id, row.visits?.factories?.name, row.visits?.factories?.factory_code))
        .slice(0, MAX_PER_GROUP)
        .map(row => ({
          id: row.id,
          href: localeHref(locale, `/reports/inspection/${row.id}`),
          title: row.visits?.factories?.name ?? dashboard.search.inspectionFallback,
          detail: row.id.slice(0, ID_PREVIEW),
        })),
    },
  ];

  const total = groups.reduce((count, group) => count + group.rows.length, 0);

  return (
    <Card as="section" labelledBy="dashboard-search-results">
      <CardHeader
        level="h2"
        titleId="dashboard-search-results"
        title={fill(dashboard.search.heading, { query })}
      />
      <CardBody>
        {total ? (
          <CardGrid min="sm">
            {groups.filter(group => group.rows.length).map(group => (
              <div className={styles.group} key={group.key}>
                <div className={styles.heading}>
                  <Overline as="p" id={`dashboard-search-${group.key}`}>{group.heading}</Overline>
                </div>

                <ListRows bleed={false} labelledBy={`dashboard-search-${group.key}`}>
                  {group.rows.map(row => (
                    <ListRow
                      key={row.id}
                      href={row.href}
                      title={row.title}
                      description={<bdi>{row.detail}</bdi>}
                    />
                  ))}
                </ListRows>
              </div>
            ))}
          </CardGrid>
        ) : (
          <EmptyState icon="search" title={dashboard.search.empty} size="sm" />
        )}
      </CardBody>
    </Card>
  );
}
