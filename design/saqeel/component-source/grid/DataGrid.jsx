import React from "react";
/* Inspection Data Grid — flagship. Sticky header, pinned first column,
   sorting (multi via shift-click), selection + bulk bar, row expansion,
   density, pagination, loading/empty/error states. Virtualise by passing
   a windowed "rows" slice; the grid renders what it is given. */
export function DataGrid({
  columns = [], rows = [], rowKey = (r, i) => r.id ?? i,
  selectable, selected = new Set(), onSelect,
  sort = [], onSort,
  density = "comfortable",
  toolbar, bulkActions,
  expandRow, expandedKeys = new Set(), onExpand,
  rowActions, onRowClick,
  page, pageCount, onPage, total,
  loading, error, empty,
  maxHeight = 520,
}) {
  const allKeys = rows.map(rowKey);
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  const someSelected = allKeys.some((k) => selected.has(k));
  const toggleAll = () => onSelect && onSelect(allSelected ? new Set() : new Set(allKeys));
  const toggleOne = (k) => { if (!onSelect) return; const n = new Set(selected); n.has(k) ? n.delete(k) : n.add(k); onSelect(n); };
  const sortFor = (id) => sort.find((s) => s.id === id);
  const clickSort = (col, e) => {
    if (!col.sortable || !onSort) return;
    const cur = sortFor(col.id);
    const next = { id: col.id, dir: cur && cur.dir === "asc" ? "desc" : "asc" };
    onSort(e.shiftKey ? [...sort.filter((s) => s.id !== col.id), next] : [next]);
  };
  const colCount = columns.length + (selectable ? 1 : 0) + (expandRow ? 1 : 0) + (rowActions ? 1 : 0);
  return (
    <div className="table-wrap" data-density={density === "compact" ? "compact" : undefined} style={{ display: "flex", flexDirection: "column" }}>
      {toolbar && <div className="grid-toolbar">{toolbar}</div>}
      {selectable && someSelected && (
        <div className="bulk-bar">
          <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{selected.size} selected</span>
          {bulkActions}
          <button className="btn btn-ghost btn-sm" style={{ marginInlineStart: "auto" }} onClick={() => onSelect && onSelect(new Set())}>Clear</button>
        </div>
      )}
      <div style={{ overflow: "auto", maxHeight }}>
        <table className="table">
          <thead><tr>
            {selectable && <th style={{ width: 36 }}><label className="check"><input type="checkbox" aria-label="Select all" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={toggleAll} /></label></th>}
            {expandRow && <th style={{ width: 30 }} />}
            {columns.map((c) => {
              const s = sortFor(c.id);
              return (
                <th key={c.id} className={c.pinned ? "col-pin" : ""} style={{ width: c.width, textAlign: c.align, background: "var(--surface-secondary)" }} aria-sort={s ? (s.dir === "asc" ? "ascending" : "descending") : undefined} scope="col">
                  {c.sortable
                    ? <button className="th-sort" onClick={(e) => clickSort(c, e)}>{c.header}<span aria-hidden="true" style={{ opacity: s ? 1 : 0.35, fontSize: 9 }}>{s ? (s.dir === "asc" ? "▲" : "▼") : "▲"}</span></button>
                    : c.header}
                </th>
              );
            })}
            {rowActions && <th style={{ width: 44 }}><span className="sr-only">Actions</span></th>}
          </tr></thead>
          <tbody>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={"sk" + i}>{Array.from({ length: colCount }).map((_, j) => <td key={j}><span className="skeleton" style={{ display: "block", height: 12, width: j === 0 ? 24 : "70%" }} /></td>)}</tr>
            ))}
            {!loading && error && <tr><td colSpan={colCount} style={{ height: "auto" }}>{error}</td></tr>}
            {!loading && !error && rows.length === 0 && <tr><td colSpan={colCount} style={{ height: "auto" }}>{empty}</td></tr>}
            {!loading && !error && rows.map((r, i) => {
              const k = rowKey(r, i);
              const isSel = selected.has(k);
              const isExp = expandedKeys.has(k);
              return (
                <React.Fragment key={k}>
                  <tr className={isSel ? "is-selected" : ""} onClick={onRowClick ? () => onRowClick(r) : undefined} style={onRowClick ? { cursor: "pointer" } : undefined}>
                    {selectable && <td onClick={(e) => e.stopPropagation()}><label className="check"><input type="checkbox" aria-label="Select row" checked={isSel} onChange={() => toggleOne(k)} /></label></td>}
                    {expandRow && <td onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm btn-icon" aria-expanded={isExp} aria-label="Expand" onClick={() => onExpand && onExpand(k)}
                        style={{ transform: isExp ? "rotate(90deg)" : undefined, transition: "transform var(--motion-fast)" }}>›</button></td>}
                    {columns.map((c) => (
                      <td key={c.id} className={(c.pinned ? "col-pin " : "") + (c.numeric ? "cell-num " : "") + (c.truncate ? "cell-trunc" : "")} style={{ textAlign: c.align, background: c.pinned ? "var(--surface-primary)" : undefined }} title={c.truncate && typeof r[c.id] === "string" ? r[c.id] : undefined}>
                        {c.cell ? c.cell(r) : r[c.id]}
                      </td>
                    ))}
                    {rowActions && <td onClick={(e) => e.stopPropagation()}>{rowActions(r)}</td>}
                  </tr>
                  {isExp && <tr><td colSpan={colCount} style={{ height: "auto", background: "var(--surface-secondary)", padding: "var(--space-3)" }}>{expandRow(r)}</td></tr>}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {(page != null || total != null) && (
        <div className="grid-footer">
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{total != null ? total.toLocaleString() + " records" : ""}</span>
          {page != null && pageCount != null && (
            <nav className="pagination" aria-label="Pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => onPage && onPage(page - 1)}>‹</button>
              <span className="t-meta" style={{ fontVariantNumeric: "tabular-nums" }}>{page} / {pageCount}</span>
              <button className="page-btn" disabled={page === pageCount} onClick={() => onPage && onPage(page + 1)}>›</button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}