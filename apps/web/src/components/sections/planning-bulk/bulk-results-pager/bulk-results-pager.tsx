import Button from "@/components/saqeel/button/button";
import styles from "./bulk-results-pager.module.css";

export type ResultsPagerStrings = {
  pagePrev: string;
  pageNext: string;
  pageStatus: string;
};

export default function BulkResultsPager({ page, pageCount, pageSize, total, strings, onPageChange }: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  strings: ResultsPagerStrings;
  onPageChange: (page: number) => void;
}) {
  const first = total === 0 ? 0 : page * pageSize + 1;
  const last = Math.min(total, (page + 1) * pageSize);

  return (
    <nav className={styles.root} aria-label={strings.pageStatus.replace("{a}", String(first)).replace("{b}", String(last)).replace("{n}", String(total))}>
      <Button variant="tertiary" icon="previousPage" disabled={page === 0} onClick={() => onPageChange(Math.max(0, page - 1))}>
        {strings.pagePrev}
      </Button>
      <span className={styles.status} role="status" aria-live="polite">
        {strings.pageStatus.replace("{a}", String(first)).replace("{b}", String(last)).replace("{n}", String(total))}
      </span>
      <Button variant="tertiary" iconEnd="nextPage" disabled={page >= pageCount - 1} onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}>
        {strings.pageNext}
      </Button>
    </nav>
  );
}
