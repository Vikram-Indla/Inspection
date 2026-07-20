/** Pagination — localized accessible names for Previous/Next and each page; ≥40px targets. */
export interface PaginationProps {
  page?: number;
  pages?: number;
  onChange?: (page: number) => void;
  labels?: { prev: string; next: string; page: string };
  className?: string;
}
export declare function Pagination(props: PaginationProps): JSX.Element;
