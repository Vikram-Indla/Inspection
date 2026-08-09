import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import Button from "@/components/saqeel/button/button";
import styles from "./factory-profile.module.css";

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

export default function FactoryProfile({ groups, official, inspection, href, strings }: {
  groups: readonly FactoryProfileGroup[];
  official: number;
  inspection: number;
  href: string;
  strings: FactoryProfileStrings;
}) {
  const count = (template: string, value: number) => template.replace("{n}", String(value));
  return (
    <details className={styles.section}>
      <summary className={styles.summary}>
        <span className={styles.summaryText}>
          <strong className={styles.title}>{strings.title}</strong>
        </span>
        <span className={styles.marker} aria-hidden="true" />
      </summary>
      <div className={styles.content}>
        <div className={styles.groups}>
          {groups.map(group => (
            <div className={styles.group} key={group.key}>
              <p className={styles.label}>{group.label}</p>
              <DefinitionList items={group.facts} />
            </div>
          ))}

          <div className={styles.group}>
            <p className={styles.label}>{strings.media}</p>
            <ul className={styles.counts}>
              <li>{count(strings.officialCount, official)}</li>
              <li>{count(strings.inspectionCount, inspection)}</li>
            </ul>
          </div>
        </div>

        <p className={styles.note}>{strings.mediaNote}</p>
        <Button variant="secondary" size="sm" href={href} block>{strings.openLabel}</Button>
      </div>
    </details>
  );
}
