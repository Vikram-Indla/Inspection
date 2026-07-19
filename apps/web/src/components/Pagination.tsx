/**
 * Shared pagination control. Genuine pre-existing frontend gap (DSM-022):
 * no shared pagination UI existed anywhere in the app before this component —
 * only apps/web/src/lib/supabase-pagination.ts, a data-fetch offset helper.
 * Built from existing ax-btn/ax-pagination tokens only, no new colors.
 */
"use client";

type PaginationProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  prevLabel: string;
  nextLabel: string;
  pageLabel: (page: number) => string;
};

function pageWindow(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const items = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...items].filter(p => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

export default function Pagination({ page, pageCount, onChange, prevLabel, nextLabel, pageLabel }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav className="ax-pagination" aria-label={pageLabel(page)}>
      <button type="button" className="ax-pagination__item" disabled={page <= 1} onClick={() => onChange(page - 1)}>{prevLabel}</button>
      {pageWindow(page, pageCount).map((p, i) =>
        p === "…"
          ? <span key={`gap-${i}`} className="ax-pagination__overflow">…</span>
          : <button
              key={p}
              type="button"
              className="ax-pagination__item"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onChange(p)}
            >{p}</button>
      )}
      <button type="button" className="ax-pagination__item" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>{nextLabel}</button>
    </nav>
  );
}
