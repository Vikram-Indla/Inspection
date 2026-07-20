import React from "react";

export function Pagination({
  page = 1,
  pages = 1,
  onChange,
  labels = { nav: "Pagination", prev: "Previous page", next: "Next page", page: "Page" },
  className = "",
}) {
  const go = target => onChange?.(Math.min(pages, Math.max(1, target)));
  const numbers = [];
  for (let candidate = 1; candidate <= pages; candidate += 1) {
    if (candidate === 1 || candidate === pages || Math.abs(candidate - page) <= 1) numbers.push(candidate);
    else if (numbers[numbers.length - 1] !== "…") numbers.push("…");
  }

  return (
    <nav className={`ax-pagination ${className}`} aria-label={labels.nav}>
      <button type="button" className="ax-pagination__item" aria-label={labels.prev} disabled={page <= 1} onClick={() => go(page - 1)}>‹</button>
      {numbers.map((item, index) => item === "…"
        ? <span key={`overflow-${index}`} className="ax-pagination__overflow" aria-hidden="true">…</span>
        : (
          <button
            type="button"
            key={item}
            className="ax-pagination__item"
            aria-label={`${labels.page} ${item}`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => go(item)}
          >
            {item}
          </button>
        ))}
      <button type="button" className="ax-pagination__item" aria-label={labels.next} disabled={page >= pages} onClick={() => go(page + 1)}>›</button>
    </nav>
  );
}
