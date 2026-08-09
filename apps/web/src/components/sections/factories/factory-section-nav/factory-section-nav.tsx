import styles from "./factory-section-nav.module.css";

export type FactorySection = {
  readonly id: string;
  readonly label: string;
};

export default function FactorySectionNav({ sections, label }: {
  sections: readonly FactorySection[];
  label: string;
}) {
  return (
    <nav className={styles.root} aria-label={label}>
      {sections.map(section => (
        <a key={section.id} className={styles.item} href={`#${section.id}`}>{section.label}</a>
      ))}
    </nav>
  );
}
