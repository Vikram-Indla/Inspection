import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import { formatCount } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import Button from "@/components/saqeel/button/button";
import styles from "./factory-profile.module.css";
import { Text } from "@/components/saqeel/type";

export type FactoryProfileGroup = {
  readonly key: string;
  readonly label: string;
  readonly facts: readonly Definition[];
};

export type FactoryProfileStrings = {
  readonly title: string;
  readonly media: string;
  readonly officialCount: string;
  readonly inspectionCount: string;
  readonly mediaNote: string;
  readonly openLabel: string;
};

export default function FactoryProfile({ groups, official, inspection, href, locale, strings }: {
  groups: readonly FactoryProfileGroup[];
  official: number;
  inspection: number;
  href: string;
  locale: Locale;
  strings: FactoryProfileStrings;
}) {
  const count = (template: string, value: number) => template.replace("{n}", formatCount(value, locale));
  return (
    <details className={styles.section}>
      <summary className={styles.summary}>
        <span className={styles.summaryText}>
          <Text as="strong" role="bodyStrong" tone="inherit">{strings.title}</Text>
        </span>
        <span className={styles.marker} aria-hidden="true" />
      </summary>
      <div className={styles.content}>
        <div className={styles.groups}>
          {groups.map(group => (
            <div className={styles.group} key={group.key}>
              <Text role="label" tone="muted">{group.label}</Text>
              <DefinitionList items={group.facts} />
            </div>
          ))}

          <div className={styles.group}>
            <Text role="label" tone="muted">{strings.media}</Text>
            <ul className={styles.counts}>
              <li>{count(strings.officialCount, official)}</li>
              <li>{count(strings.inspectionCount, inspection)}</li>
            </ul>
          </div>
        </div>

        <Text tone="muted">{strings.mediaNote}</Text>
        <Button variant="secondary" size="sm" href={href} block>{strings.openLabel}</Button>
      </div>
    </details>
  );
}
