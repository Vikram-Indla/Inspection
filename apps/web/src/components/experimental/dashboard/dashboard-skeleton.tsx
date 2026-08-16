import { Card, linearTheme } from "@/components/experimental/linear";
import styles from "./dashboard-screen.module.css";
import bones from "@/components/experimental/planning-expiry/expiry-skeleton.module.css";

const SECTIONS = [3, 2, 2, 3] as const;

export default function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div className={linearTheme.root}>
      <div className={styles.page} role="status" aria-busy="true" aria-label={label}>
        <div className={styles.band}>
          <div className={styles.header}>
            <div className={`${bones.bone} ${bones.title}`} />
            <div className={`${bones.bone} ${bones.subtitle}`} />
          </div>
          <div className={`${bones.bone} ${bones.notice}`} />
        </div>

        <div className={styles.stack}>
          {SECTIONS.map((cards, index) => (
            <Card as="section" key={index}>
              <div className={bones.card}>
                <div className={`${bones.bone} ${bones.sectionHeading}`} />
                <div className={bones.rows}>
                  {Array.from({ length: cards }, (_, row) => (
                    <div className={`${bones.bone} ${bones.row}`} key={row} />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
