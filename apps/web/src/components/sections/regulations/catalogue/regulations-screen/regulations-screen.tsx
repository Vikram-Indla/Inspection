import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { readRegulationAccess } from "@/features/regulations/access";
import { regulationHref, type RegulationScope } from "@/features/regulations/params";
import { queryRegulationCatalogue } from "@/features/regulations/queries";
import {
  authoritiesOf, filterRegulations, statusCountsOf, toRegulationRow,
} from "@/features/regulations/rows";
import { fill, getMessages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./regulations-screen.module.css";
import RegulationAuthorityNav from "../regulation-authority-nav/regulation-authority-nav";
import RegulationCatalogue from "../regulation-catalogue/regulation-catalogue";
import RegulationFilterBar from "../regulation-filter-bar/regulation-filter-bar";
import RegulationGovernanceNotice from "../regulation-governance-notice/regulation-governance-notice";

export default async function RegulationsScreen({ locale, scope }: {
  locale: Locale;
  scope: RegulationScope;
}) {
  const { regulations } = getMessages(locale);
  const [catalogue, access] = await Promise.all([queryRegulationCatalogue(), readRegulationAccess()]);
  const rows = catalogue.rows.map(row => toRegulationRow(row, catalogue));
  const authorities = authoritiesOf(rows);
  const visible = filterRegulations(rows, scope);
  const filtered = Boolean(scope.search || scope.authority || scope.status);
  const href = (overrides: Parameters<typeof regulationHref>[1]) =>
    localeHref(locale, regulationHref(scope, overrides));
  const statusLabelFor = (status: string) =>
    status ? regulations.status[status as keyof typeof regulations.status] ?? status : regulations.status.all;

  if (!catalogue.libraryReadable) {
    return (
      <Card as="section" labelledBy="regulation-degraded">
        <CardHeader level="h2" titleId="regulation-degraded" title={regulations.degraded.title} />
        <CardBody gap="tight">
          <EmptyState tone="danger" title={regulations.degraded.body} size="sm" />
        </CardBody>
        <CardFooter>
          <Button variant="secondary" size="sm" href={href({})} label={regulations.degraded.retry}>
            {regulations.degraded.retry}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className={styles.stack}>
      <RegulationGovernanceNotice locale={locale} access={access} strings={regulations} />

      <div className={styles.layout}>
        <RegulationAuthorityNav
          authorities={authorities}
          total={rows.length}
          current={scope.authority}
          hrefFor={authority => href({ authority })}
          strings={regulations.authorities}
        />

        <Card as="section" labelledBy="regulation-catalogue">
          <CardHeader
            level="h2"
            titleId="regulation-catalogue"
            title={scope.authority
              ? authorities.find(entry => entry.key === scope.authority)?.label ?? regulations.authorities.notRecorded
              : regulations.catalogue.heading}
            description={fill(regulations.catalogue.count, { shown: visible.length, total: rows.length })}
          />
          <CardBody>
            <RegulationFilterBar
              action={localeHref(locale, scope.routeBase)}
              search={scope.search}
              authority={scope.authority}
              status={scope.status}
              counts={statusCountsOf(rows)}
              hrefFor={status => href({ status })}
              clearHref={href({ search: "", authority: "", status: "" })}
              filtered={filtered}
              labelFor={statusLabelFor}
              strings={regulations.catalogue}
            />
            <RegulationCatalogue
              rows={visible}
              selectedId={scope.selectedId}
              statusLabelFor={statusLabelFor}
              hrefFor={row => href({ selectedId: row.id })}
              formatDay={iso => formatDate(iso, locale)}
              strings={{
                ...regulations.table,
                ...regulations.footprint,
                notRecorded: regulations.authorities.notRecorded,
                emptyTitle: rows.length ? regulations.empty.filteredTitle : regulations.empty.title,
                emptyBody: rows.length ? regulations.empty.filteredBody : regulations.empty.body,
              }}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
