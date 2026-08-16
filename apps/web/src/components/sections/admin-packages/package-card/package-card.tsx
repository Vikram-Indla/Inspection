import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { AdminPackagesMessages } from "@/features/admin-packages/strings";
import {
  currentPublished,
  definitionSize,
  isSuperseded,
  orderedVersions,
  type PackageRow,
  type VersionRow,
} from "@/features/admin-packages/view";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import styles from "./package-card.module.css";

const TONE: Readonly<Record<string, StatusTone>> = {
  published: "success",
  locked: "info",
  draft: "warning",
};

export default function PackageCard({ pkg, today, strings, locale, impactFor, editorFor }: {
  pkg: PackageRow;
  today: string;
  strings: AdminPackagesMessages;
  locale: Locale;
  impactFor: (version: VersionRow) => React.ReactNode;
  editorFor: (version: VersionRow) => React.ReactNode;
}) {
  const versions = orderedVersions(pkg);
  const latest = currentPublished(pkg, today);
  const countLabel = versions.length === 1
    ? strings.register.oneVersion
    : fill(strings.register.versionCount, { count: formatCount(versions.length, locale) });

  return (
    <Card>
      <CardHeader
        description={pkg.scope ?? strings.register.noScope}
        level="h2"
        title={pkg.title}
        trailing={<Text role="label" tone="muted">{countLabel}</Text>}
      />
      <CardBody>
        <Mono tone="muted">{pkg.code}</Mono>

        {versions.length === 0 ? (
          <Text tone="muted">{strings.register.noVersions}</Text>
        ) : (
          <ul className={styles.versions}>
            {versions.map(version => {
              const size = definitionSize(version);
              const superseded = isSuperseded(version, latest);
              return (
                <li className={styles.version} key={version.id}>
                  <div className={styles.versionHead}>
                    <Mono tone="primary">{version.version_label}</Mono>
                    <StatusPill ping={false} tone={TONE[version.status] ?? "neutral"}>
                      {strings.states[version.status as keyof typeof strings.states] ?? version.status}
                    </StatusPill>
                    {superseded ? (
                      <Text role="label" tone="muted">{strings.register.supersededNote}</Text>
                    ) : null}
                  </div>

                  <Text role="label" tone="secondary">
                    {fill(strings.register.sections, {
                      sections: formatCount(size.sections, locale),
                      items: formatCount(size.items, locale),
                    })}
                  </Text>

                  {version.published_at ? (
                    <Text role="label" tone="muted">
                      {fill(strings.register.publishedOn, { date: formatDate(version.published_at, locale) })}
                    </Text>
                  ) : null}

                  <div className={styles.panels}>
                    <details className={styles.panel}>
                      <summary className={styles.summary}>
                        <Text as="span" role="label" tone="accent">
                          {fill(strings.register.impactFor, { version: version.version_label })}
                        </Text>
                      </summary>
                      <div className={styles.panelBody}>{impactFor(version)}</div>
                    </details>
                    {editorFor(version)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
