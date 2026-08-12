import Button from "@/components/saqeel/button/button";
import styles from "./factory-sections.module.css";
import { Text } from "@/components/saqeel/type";

export type FactorySection = {
  readonly key: string;
  readonly title: string;
  readonly body: string;
  readonly openLabel: string;
  readonly href: string;
};

export default function FactorySections({ sections, availableLabel }: {
  sections: readonly FactorySection[];
  availableLabel: string;
}) {
  return (
    <div className={styles.sections}>
      <Text tone="muted">{availableLabel}</Text>
      {sections.map(section => (
        <details className={styles.section} key={section.key}>
          <summary className={styles.summary}>
            <span className={styles.summaryText}>
              <Text as="strong" role="bodyStrong" tone="inherit">{section.title}</Text>
              <Text as="span" tone="muted">{section.body}</Text>
            </span>
            <span className={styles.marker} aria-hidden="true" />
          </summary>
          <div className={styles.sectionContent}>
            <Button variant="secondary" size="sm" href={section.href} label={section.openLabel}>
              {section.openLabel}
            </Button>
          </div>
        </details>
      ))}
    </div>
  );
}
