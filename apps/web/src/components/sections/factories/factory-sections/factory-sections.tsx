import Button from "@/components/saqeel/button/button";
import styles from "./factory-sections.module.css";

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
      {sections.map(section => (
        <details className={styles.section} key={section.key}>
          <summary className={styles.summary}>
            <span className={styles.summaryText}>
              <strong className={styles.sectionTitle}>{section.title}</strong>
              <small className={styles.sectionBody}>{section.body}</small>
            </span>
            <span className={styles.marker} aria-hidden="true" />
          </summary>
          <div className={styles.sectionContent}>
            <p className={styles.note}>{availableLabel}</p>
            <Button variant="secondary" size="sm" href={section.href} label={section.openLabel}>
              {section.openLabel}
            </Button>
          </div>
        </details>
      ))}
    </div>
  );
}
