import Link from "next/link";
import { CardBody, Text } from "@/components/experimental/linear";
import { EmptyBlock } from "@/components/experimental/linear-data";
import type { FactoryRef, VisitRow } from "@/app/(app)/dashboard/metrics";
import { fill, getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import { SectionCard } from "@/components/experimental/dashboard-parts/dashboard-chrome";
import styles from "./dashboard-search.module.css";

const MAX_PER_GROUP = 6;
const ID_PREVIEW = 8;

type InspectionMatch = {
  readonly id: string;
  readonly visits: { factories: FactoryRef | null } | null;
};

export default function DashboardSearch({ locale, query, factories, visits, inspections }: {
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

  const groups = [
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
    <SectionCard id="dashboard-search-results" title={fill(dashboard.search.heading, { query })}>
      <CardBody>
        {total ? (
          <div className={styles.groups}>
            {groups.filter(group => group.rows.length).map(group => (
              <div className={styles.group} key={group.key}>
                <Text role="caption" tone="muted" as="span" id={`dashboard-search-${group.key}`}>
                  {group.heading}
                </Text>
                <ul className={styles.rows} aria-labelledby={`dashboard-search-${group.key}`}>
                  {group.rows.map(row => (
                    <li key={row.id}>
                      <Link className={styles.row} href={row.href}>
                        <Text role="caption" tone="strong" weight="medium" as="span">{row.title}</Text>
                        <Text role="caption" tone="muted" as="span"><bdi>{row.detail}</bdi></Text>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <EmptyBlock title={dashboard.search.empty} />
        )}
      </CardBody>
    </SectionCard>
  );
}
