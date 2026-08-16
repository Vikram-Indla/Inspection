import { ListRow } from "@/components/saqeel/list-row/list-row";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { AdminPackagesMessages } from "@/features/admin-packages/strings";
import {
  currentPublished,
  definitionSize,
  orderedVersions,
  packagesHref,
  type PackageRow,
  type PackagesQuery,
  type VersionRow,
} from "@/features/admin-packages/view";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import styles from "./package-row.module.css";

const TONE: Readonly<Record<string, StatusTone>> = {
  published: "success",
  locked: "info",
  draft: "warning",
};

function StatePill({ version, strings }: { version: VersionRow; strings: AdminPackagesMessages }) {
  return (
    <StatusPill ping={false} tone={TONE[version.status] ?? "neutral"}>
      {fill(strings.register.stateVersion, {
        state: strings.states[version.status as keyof typeof strings.states] ?? version.status,
        version: version.version_label,
      })}
    </StatusPill>
  );
}

export default function PackageRow({ pkg, today, query, strings, locale }: {
  pkg: PackageRow;
  today: string;
  query: PackagesQuery;
  strings: AdminPackagesMessages;
  locale: Locale;
}) {
  const versions = orderedVersions(pkg);
  const draft = versions.find(version => version.status === "draft") ?? null;
  const published = currentPublished(pkg, today);
  const shown = draft ?? published ?? versions[0] ?? null;
  const size = shown ? definitionSize(shown) : null;

  return (
    <ListRow
      badge={
        <span className={styles.pills}>
          {draft ? <StatePill strings={strings} version={draft} /> : null}
          {published ? <StatePill strings={strings} version={published} /> : null}
          {versions.length === 0 ? (
            <StatusPill ping={false} tone="neutral">{strings.states.empty}</StatusPill>
          ) : null}
        </span>
      }
      description={pkg.scope ?? strings.register.noScope}
      href={packagesHref({ ...query, packageId: pkg.id, versionId: shown?.id ?? "", tab: null })}
      meta={
        size ? (
          <Text as="span" role="label" tone="secondary">
            {fill(strings.register.sections, {
              sections: formatCount(size.sections, locale),
              items: formatCount(size.items, locale),
            })}
          </Text>
        ) : (
          <Text as="span" role="label" tone="muted">{strings.register.startFirstVersion}</Text>
        )
      }
      title={
        <span className={styles.headline}>
          {pkg.title}
          <Mono tone="muted">{pkg.code}</Mono>
        </span>
      }
    />
  );
}
