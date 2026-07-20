import React from "react";
export function Pagination({ page = 1, pageCount = 1, onChange }) {
  const go = (p) => onChange && onChange(Math.min(Math.max(1, p), pageCount));
  const pages = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="page-btn" disabled={page === 1} onClick={() => go(page - 1)} aria-label="Previous">‹</button>
      {pages.map((p, i) => p === "…"
        ? <span key={"e" + i} className="t-meta">…</span>
        : <button key={p} className={"page-btn" + (p === page ? " is-active" : "")} aria-current={p === page ? "page" : undefined} onClick={() => go(p)}>{p}</button>)}
      <button className="page-btn" disabled={page === pageCount} onClick={() => go(page + 1)} aria-label="Next">›</button>
    </nav>
  );
}