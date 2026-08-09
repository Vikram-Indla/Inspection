import Button from "@/components/saqeel/button/button";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import type { EnforcementDetailView } from "@/features/enforcement/records";
import styles from "./enforcement-drawer.module.css";

export type EnforcementDrawerActionStrings = {
  readonly close: string;
  readonly closeDetail: string;
  readonly openFactory: string;
};

export default function EnforcementDrawer({ detail, closeHref, strings }: {
  detail: EnforcementDetailView;
  closeHref: string;
  strings: EnforcementDrawerActionStrings;
}) {
  return (
    <>
      <a className={styles.backdrop} href={closeHref} aria-label={strings.closeDetail}></a>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enforcement-detail-title"
      >
        <header className={styles.head}>
          <div className={styles.headline}>
            <h2 className={styles.title} id="enforcement-detail-title">{detail.title}</h2>
            <p className={styles.reference}>{detail.reference}</p>
          </div>
          <Button
            href={closeHref}
            variant="tertiary"
            size="sm"
            icon="dismiss"
            label={strings.close}
            compactLabel
          >
            {strings.close}
          </Button>
        </header>
        <div className={styles.body}>
          {detail.groups.map(group => (
            <section className={styles.group} key={group.label}>
              <h3 className={styles.groupLabel}>{group.label}</h3>
              <DefinitionList items={group.items} />
            </section>
          ))}
        </div>
        <footer className={styles.actions}>
          <Button href={`/factories/${detail.factoryId}`} variant="primary" block>
            {strings.openFactory}
          </Button>
        </footer>
      </aside>
    </>
  );
}
