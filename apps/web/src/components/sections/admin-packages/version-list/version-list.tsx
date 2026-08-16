import type { ReactNode } from "react";
import { ListRow, ListRows } from "@/components/saqeel/list-row/list-row";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import type { AdminPackagesMessages } from "@/features/admin-packages/strings";
import {
  currentPublished,
  isSuperseded,
  orderedVersions,
  packagesHref,
  type PackageRow,
  type PackagesQuery,
  type VersionRow,
} from "@/features/admin-packages/view";
import { fill } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import PackagesDisclosure from "../packages-disclosure/packages-disclosure";
import styles from "./version-list.module.css";

const TONE: Readonly<Record<string, StatusTone>> = {
  published: "success",
  locked: "info",
  draft: "warning",
};

function effectiveWindow(version: VersionRow, strings: AdminPackagesMessages, locale: Locale): string | null {
  if (!version.effective_from) return null;
  return fill(strings.register.effective, {
    from: formatDate(version.effective_from, locale),
    to: version.effective_to ? formatDate(version.effective_to, locale) : strings.register.openEnded,
  });
}

export default function VersionList({
  pkg, selectedId, today, query, strings, locale, canWrite, deactivateFor, newDraftForm,
}: {
  pkg: PackageRow;
  selectedId: string | null;
  today: string;
  query: PackagesQuery;
  strings: AdminPackagesMessages;
  locale: Locale;
  canWrite: boolean;
  deactivateFor: (version: VersionRow) => ReactNode;
  newDraftForm: ReactNode;
}) {
  const versions = orderedVersions(pkg);
  const latest = currentPublished(pkg, today);

  return (
    <div className={styles.panel}>
      <Heading level={3} visual="subheading">{strings.workbench.versionsHeading}</Heading>

      {versions.length === 0 ? (
        <Text tone="muted">{strings.register.noVersions}</Text>
      ) : (
        <ListRows bleed={false} label={strings.workbench.versionsHeading}>
          {versions.map(version => (
            <ListRow
              badge={
                <span className={styles.pills}>
                  <StatusPill ping={false} tone={TONE[version.status] ?? "neutral"}>
                    {strings.states[version.status as keyof typeof strings.states] ?? version.status}
                  </StatusPill>
                  {isSuperseded(version, latest) ? (
                    <Text as="span" role="label" tone="muted">{strings.register.supersededNote}</Text>
                  ) : null}
                </span>
              }
              description={effectiveWindow(version, strings, locale) ?? undefined}
              href={version.id === selectedId
                ? undefined
                : packagesHref({ ...query, versionId: version.id, tab: "versions" })}
              key={version.id}
              meta={version.published_at ? (
                <Text as="span" role="label" tone="secondary">
                  {fill(strings.register.publishedOn, { date: formatDate(version.published_at, locale) })}
                </Text>
              ) : null}
              title={<Mono tone="primary">{version.version_label}</Mono>}
            />
          ))}
        </ListRows>
      )}

      {canWrite ? versions
        .filter(version => version.status !== "draft")
        .map(version => (
          <PackagesDisclosure
            hint={strings.workbench.deactivateHint}
            key={version.id}
            summary={fill(strings.workbench.deactivateSummary, { version: version.version_label })}
            tone="danger"
          >
            {deactivateFor(version)}
          </PackagesDisclosure>
        )) : null}

      {canWrite ? (
        <section className={styles.create}>
          <Heading level={3} visual="subheading">{strings.workbench.newVersionHeading}</Heading>
          {newDraftForm}
        </section>
      ) : null}
    </div>
  );
}
