import Button from "@/components/saqeel/button/button";
import { Heading } from "@/components/saqeel/type";
import type { FieldHomeCopy } from "@/features/field-home/labels";
import styles from "./field-home.module.css";

export default function FieldQuickActions({ activeInspection, copy }: {
  activeInspection: { href: string; factoryName: string } | null;
  copy: FieldHomeCopy;
}) {
  return (
    <section aria-labelledby="field-actions-heading">
      <div className={styles.sectionHead}>
        <Heading level={2} visual="label" id="field-actions-heading">{copy.quickActions.heading}</Heading>
      </div>

      <div className={styles.rail}>
        <Button href="/planning/immediate" prefetch={false} variant="primary" icon="create">
          {copy.quickActions.immediate}
        </Button>
        <Button href="/field/search" prefetch={false} variant="secondary" icon="search">
          {copy.quickActions.search}
        </Button>
        {activeInspection ? (
          <Button href={activeInspection.href} prefetch={false} variant="secondary" icon="inspect">
            {`${copy.quickActions.continue} — ${activeInspection.factoryName}`}
          </Button>
        ) : null}
        <Button href="/field/visits" prefetch={false} variant="secondary" icon="visits">
          {copy.quickActions.myVisits}
        </Button>
      </div>
    </section>
  );
}
