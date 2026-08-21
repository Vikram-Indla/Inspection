import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { Factory360Dossier } from "@/lib/factory360/dossier";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import { fill } from "@/i18n/messages";
import type { CrFormatters, CrStrings } from "@/features/factories/cr-dossier/view";
import styles from "./factory360-cr.module.css";

export default function CrLicenseRail({ dossier, fmt, strings, locale }: {
  dossier: Factory360Dossier;
  fmt: CrFormatters;
  strings: CrStrings;
  locale: Locale;
}) {
  const { cr, licenses, selected } = dossier;
  if (!cr) return null;
  const count = licenses.length === 1 ? strings.licenses.one : fill(strings.licenses.count, { count: licenses.length });

  return (
    <Card as="section" labelledBy="f360cr-licenses">
      <CardHeader level="h2" titleId="f360cr-licenses" title={strings.licenses.heading} description={`${cr.cr_number} · ${count}`} />
      <CardBody>
        {licenses.length ? (
          <ul className={styles.rail}>
            {licenses.map(row => (
              <li key={row.id}>
                <a
                  className={styles.railItem}
                  href={localeHref(locale, `/factories/cr/${cr.id}?license=${row.id}`)}
                  data-selected={row.id === selected?.id ? "" : undefined}
                  aria-current={row.id === selected?.id ? "page" : undefined}
                >
                  <span className={styles.railHead}>
                    <Text as="span" role="bodyStrong" dir="auto">{fmt.text(row.factories?.name)}</Text>
                    <StatusPill tone="neutral">{fmt.label(row.factories?.risk_band)}</StatusPill>
                  </span>
                  <span className={styles.railMeta}>
                    <span className={styles.railFact}>
                      <Text as="span" role="label" tone="muted">{strings.license.number}</Text>
                      <Mono>{row.license_number}</Mono>
                    </span>
                    <span className={styles.railFact}>
                      <Text as="span" role="label" tone="muted">{strings.fields.plant}</Text>
                      <Mono>{fmt.text(row.plant_number)}</Mono>
                    </span>
                    <span className={styles.railFact}>
                      <Text as="span" role="label" tone="muted">{strings.fields.status}</Text>
                      <Text as="span" role="body">{fmt.label(row.status)}</Text>
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="factory" title={strings.licenses.empty} size="sm" />
        )}
      </CardBody>
    </Card>
  );
}
