import Link from "next/link";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Heading, Text } from "@/components/saqeel/type";
import type { EstablishmentsData } from "@/features/field-establishments/queries";
import { getMessages, fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import EstablishmentCard from "./establishment-card";
import EstablishmentFilters from "./establishment-filters";
import styles from "./establishments.module.css";

export default function EstablishmentsScreen({ data, locale }: {
  data: EstablishmentsData;
  locale: Locale;
}) {
  const copy = getMessages(locale).fieldEstablishments;
  const { query, rows } = data;

  const tab = (status: "licensed" | "unlicensed", label: string, count: number) => (
    <Link
      role="tab"
      aria-selected={query.status === status}
      href={data.hrefFor({ status })}
      className={`${styles.tab} ${query.status === status ? styles.tabActive : ""}`}
    >
      <Text role="label" as="span" tone={query.status === status ? "inherit" : "secondary"}>
        {`${label} (${count})`}
      </Text>
    </Link>
  );

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerIdentity}>
          <Heading level={1} visual="subheading">{copy.title}</Heading>
          <Text role="label" tone="secondary" as="p">{copy.subtitle}</Text>
        </div>
        <Button href="/field/establishments/unregistered" variant="primary" size="sm" icon="create">
          {copy.addUnlicensed}
        </Button>
      </header>

      <div className={styles.page}>
        <div className={styles.tabs} role="tablist" aria-label={copy.tabs.label}>
          {tab("licensed", copy.tabs.licensed, data.licensedCount)}
          {tab("unlicensed", copy.tabs.unlicensed, data.unlicensedCount)}
        </div>

        {data.showEmptyHint ? (
          <Card as="section" role="status">
            <CardBody>
              <div className={styles.hint}>
                <Icon name="info" size="sm" />
                <Text tone="secondary" as="span">{copy.emptyHint}</Text>
                <span className={styles.grow} />
                <Button href="/field/establishments/unregistered" variant="primary" size="sm">
                  {copy.addUnlicensed}
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : null}

        <form method="get" className={styles.searchRow}>
          <input type="hidden" name="status" value={query.status} />
          {query.risk ? <input type="hidden" name="risk" value={query.risk} /> : null}
          {query.region ? <input type="hidden" name="region" value={query.region} /> : null}
          {query.city ? <input type="hidden" name="city" value={query.city} /> : null}
          <span className={styles.searchField}>
            <TextInput
              type="search"
              name="q"
              defaultValue={query.q}
              label={copy.search.label}
              placeholder={copy.search.placeholder}
            />
          </span>
          <Button href={data.hrefFor({ filter: "1" })} variant="secondary" icon="filter">
            {copy.search.filter}
          </Button>
        </form>

        {data.failed ? (
          <Card as="section" role="alert">
            <CardBody>
              <Text tone="secondary">{copy.unavailable}</Text>
            </CardBody>
          </Card>
        ) : null}

        {!data.failed && rows.length === 0 && !data.showEmptyHint ? (
          <div className={styles.empty} role="status">
            <Text role="bodyStrong">{copy.empty.heading}</Text>
            <Text tone="secondary">{copy.empty.body}</Text>
          </div>
        ) : null}

        {!data.failed && rows.length > 0 ? (
          <section aria-label={copy.results}>
            <Text role="label" tone="muted">
              {fill(copy.count, { shown: data.shown, total: data.total })}
            </Text>
            <div className={styles.grid}>
              {rows.map(row => <EstablishmentCard key={row.id} row={row} copy={copy} />)}
            </div>
            {data.pageCount > 1 ? (
              <nav className={styles.pager} aria-label={copy.pager.label}>
                {query.page > 1
                  ? <Button href={data.hrefFor({ page: query.page - 1 })} variant="secondary" size="sm">{copy.pager.previous}</Button>
                  : <span />}
                <Text role="label" tone="muted">{fill(copy.pager.page, { page: query.page, count: data.pageCount })}</Text>
                {query.page < data.pageCount
                  ? <Button href={data.hrefFor({ page: query.page + 1 })} variant="secondary" size="sm">{copy.pager.next}</Button>
                  : <span />}
              </nav>
            ) : null}
          </section>
        ) : null}
      </div>

      {query.filterOpen ? (
        <EstablishmentFilters
          query={query}
          regions={data.regions}
          cities={data.cities}
          copy={copy}
          closeHref={data.hrefFor({ filter: "" })}
          clearHref={`/field/establishments?status=${query.status}`}
        />
      ) : null}
    </>
  );
}
