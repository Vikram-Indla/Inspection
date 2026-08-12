import Button from "@/components/saqeel/button/button";
import { Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import styles from "./pagination.module.css";

export type PaginationStrings = {
  readonly previous: string;
  readonly next: string;
  readonly status: string;
  readonly label: string;
};

/**
 * Page controls for a paged collection.
 *
 * `hrefFor` renders the controls as links, which keeps the surrounding list a
 * Server Component and makes a page shareable; `onPageChange` renders them as
 * buttons for a collection that is already client state. Supplying neither is
 * a defect the type prevents.
 *
 * `status` carries `{a}`, `{b}` and `{n}` — the first and last row numbers on
 * this page and the total — so a reader always knows the size of the set they
 * are paging through, not merely which page they are on.
 */
export default function Pagination({ page, pageCount, pageSize, total, strings, hrefFor, onPageChange }: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  strings: PaginationStrings;
} & (
  | { hrefFor: (page: number) => string; onPageChange?: never }
  | { onPageChange: (page: number) => void; hrefFor?: never }
)) {
  const first = total === 0 ? 0 : page * pageSize + 1;
  const last = Math.min(total, (page + 1) * pageSize);
  const status = fill(strings.status, { a: first, b: last, n: total });
  const atStart = page <= 0;
  const atEnd = page >= pageCount - 1;

  return (
    <nav className={styles.root} aria-label={strings.label}>
      <Button
        variant="tertiary" size="sm" icon="previousPage"
        disabled={atStart}
        href={hrefFor && !atStart ? hrefFor(page - 1) : undefined}
        onClick={onPageChange && !atStart ? () => onPageChange(page - 1) : undefined}
        label={strings.previous}
      >
        {strings.previous}
      </Button>
      <Text as="span" tone="muted" numeric live="status">{status}</Text>
      <Button
        variant="tertiary" size="sm" iconEnd="nextPage"
        disabled={atEnd}
        href={hrefFor && !atEnd ? hrefFor(page + 1) : undefined}
        onClick={onPageChange && !atEnd ? () => onPageChange(page + 1) : undefined}
        label={strings.next}
      >
        {strings.next}
      </Button>
    </nav>
  );
}
