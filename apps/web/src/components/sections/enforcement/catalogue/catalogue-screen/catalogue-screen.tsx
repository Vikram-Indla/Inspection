import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { titleCase } from "@/features/factories/portfolio";
import {
  CATALOGUE_MODES, queryViolationCatalogue, versionsOf, type CatalogueMode,
} from "@/features/enforcement/catalogue";
import { fill, getMessages } from "@/i18n/messages";
import { formatDate, riyadhToday } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./catalogue-screen.module.css";
import PenaltyMappingCard from "../penalty-mapping-card/penalty-mapping-card";
import ViolationCodeCard from "../violation-code-card/violation-code-card";

export default async function CatalogueScreen({ locale, mode, nowMs }: {
  locale: Locale;
  mode: CatalogueMode;
  nowMs: number;
}) {
  const { enforcement } = getMessages(locale);
  const strings = enforcement.catalogue;
  const catalogue = await queryViolationCatalogue();
  const label = (value: string) => enforcement.enum[value as keyof typeof enforcement.enum] ?? titleCase(value);
  const today = riyadhToday(nowMs);

  const tabs: SegmentedItem<CatalogueMode>[] = CATALOGUE_MODES.map(value => ({
    value,
    label: value === "catalogue" ? strings.catalogueTab : strings.penaltyTab,
    href: localeHref(locale, value === "catalogue" ? "/admin/violations?mode=catalogue" : "/admin/violations?mode=penalty"),
  }));

  return (
    <div className={styles.stack}>
      <SegmentedControl items={tabs} value={mode} label={strings.modeLabel} />

      <Card as="section" labelledBy="catalogue-governance">
        <CardHeader
          level="h2"
          titleId="catalogue-governance"
          title={strings.governanceTitle}
          trailing={<StatusPill tone="info">{strings.readOnly}</StatusPill>}
        />
        <CardBody gap="tight">
          <Text tone="secondary">{strings.governanceBody}</Text>
          {catalogue.isWriter ? null : <Text tone="secondary">{strings.readerNote}</Text>}
        </CardBody>
        <CardFooter>
          <Button
            variant="secondary" size="sm"
            href={localeHref(locale, "/admin/compliance-requests")}
            label={strings.openRequests}
          >
            {strings.openRequests}
          </Button>
        </CardFooter>
      </Card>

      {mode === "penalty" ? (
        <Card as="section" labelledBy="catalogue-lens">
          <CardHeader level="h2" titleId="catalogue-lens" title={strings.lensTitle} description={strings.lensIntro} />
          <CardBody>
            <ul className={styles.rules}>
              {[strings.lensRule1, strings.lensRule2, strings.lensRule3, strings.lensRule4].map(rule => (
                <Text as="li" tone="secondary" key={rule}>{rule}</Text>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      {!catalogue.catalogueReadable ? (
        <Card as="section" labelledBy="catalogue-degraded">
          <CardHeader level="h2" titleId="catalogue-degraded" title={strings.degradedTitle} />
          <CardBody>
            <EmptyState tone="danger" title={strings.degradedBody} size="sm" />
          </CardBody>
        </Card>
      ) : catalogue.codes.length === 0 ? (
        <Card as="section" labelledBy="catalogue-empty">
          <CardHeader level="h2" titleId="catalogue-empty" title={strings.emptyTitle} />
          <CardBody>
            <EmptyState title={strings.emptyBody} size="sm" />
          </CardBody>
        </Card>
      ) : (
        <section className={styles.list} aria-label={fill(strings.count, { count: catalogue.codes.length })}>
          {catalogue.codes.map(code => mode === "penalty" ? (
            <PenaltyMappingCard
              key={code.id}
              code={code}
              today={today}
              formatAmount={value => new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-GB").format(value)}
              formatDay={iso => formatDate(iso, locale)}
              labelFor={label}
              strings={enforcement.mapping}
            />
          ) : (
            <ViolationCodeCard
              key={code.id}
              code={code}
              triggers={catalogue.triggersByCode.get(code.code) ?? []}
              triggersReadable={catalogue.triggersReadable}
              versions={versionsOf(catalogue.codes, code.code)}
              today={today}
              labelFor={label}
              strings={enforcement.code}
            />
          ))}
        </section>
      )}

      <Text tone="muted">{mode === "penalty" ? strings.penaltyFootnote : strings.catalogueFootnote}</Text>
    </div>
  );
}
