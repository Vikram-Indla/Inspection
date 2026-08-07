import SaqeelBrandMark from "@/components/SaqeelBrandMark";
import styles from "./shell-brand.module.css";

export default function ShellBrand() {
  return (
    <p className={styles.brand} data-brand>
      <span className={styles.brandMark} aria-hidden="true">
        <SaqeelBrandMark />
      </span>
      <span className={styles.brandName} data-brand-name>
        <span className={styles.brandAr} lang="ar">صقيل</span>
        <span className={styles.brandEn} lang="en">SAQEEL</span>
      </span>
    </p>
  );
}
