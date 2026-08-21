import SaqeelBrandMark from "@/components/SaqeelBrandMark";
import { Overline } from "@/components/saqeel/type";
import styles from "./shell-brand.module.css";

export default function ShellBrand() {
  return (
    <p className={styles.brand} data-brand>
      <span className={styles.brandMark} aria-hidden="true">
        <SaqeelBrandMark />
      </span>
      <span className={styles.brandName} data-brand-name>
        <span className={styles.brandAr} lang="ar">
          <Overline as="span" tone="inherit">منصة التفتيش</Overline>
        </span>
        <span className={styles.brandEn} lang="en">
          <Overline as="span" tone="inherit">Inspection Platform</Overline>
        </span>
      </span>
    </p>
  );
}
