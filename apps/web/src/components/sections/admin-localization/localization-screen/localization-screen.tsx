import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Text } from "@/components/saqeel/type";
import type { LocalizationData } from "@/features/admin-localization/queries";
import { adminLocalizationMessages } from "@/features/admin-localization/strings";
import { localizationHref, type LocalizationQuery } from "@/features/admin-localization/view";
import type { Locale } from "@/lib/i18n";
import LocalizationAddKey from "../localization-add-key/localization-add-key";
import LocalizationCoverage from "../localization-coverage/localization-coverage";
import LocalizationFilters from "../localization-filters/localization-filters";
import LocalizationRegistry from "../localization-registry/localization-registry";
import LocalizationSync from "../localization-sync/localization-sync";
import LocalizationToolbar from "../localization-toolbar/localization-toolbar";
import styles from "./localization-screen.module.css";

export default function LocalizationScreen({ data, query, locale }: {
  data: LocalizationData;
  query: LocalizationQuery;
  locale: Locale;
}) {
  const strings = adminLocalizationMessages(locale);

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.hub },
      ]}
      description={strings.subtitle}
      title={strings.title}
    >
      <LocalizationCoverage data={data} locale={locale} strings={strings} />

      <LocalizationFilters counts={data.counts} query={query} strings={strings} />

      <LocalizationToolbar
        actions={
          <>
            <LocalizationAddKey locale={locale} strings={strings} />
            <Button href={`/admin/localization/export${localizationHref(query).replace("/admin/localization", "")}`} variant="secondary">
              {strings.toolbar.export}
            </Button>
            <LocalizationSync locale={locale} strings={strings} />
          </>
        }
        locale={locale}
        matched={data.matched}
        query={query}
        strings={strings}
        total={data.total}
      />

      <LocalizationRegistry data={data} locale={locale} query={query} strings={strings} />

      <Card>
        <CardHeader level="h2" title={strings.governance.heading} />
        <CardBody>
          <ul className={styles.governance}>
            <li><Text as="span" tone="secondary">{strings.governance.pair}</Text></li>
            <li><Text as="span" tone="secondary">{strings.governance.retire}</Text></li>
            <li><Text as="span" tone="secondary">{strings.governance.audit}</Text></li>
          </ul>
        </CardBody>
      </Card>
    </ShellPageFrame>
  );
}
