import React, { useEffect, useMemo, useRef, useState } from "react";

export function DataTable({
  columns = [],
  rows = [],
  caption,
  captionHidden = true,
  selectable = false,
  rowKey = (row, index) => index,
  rowLabel,
  rowState,
  onSelectionChange,
  onSort,
  labels = { selectAll: "Select all rows", selectRow: "Select" },
  className = "",
}) {
  const [selected, setSelected] = useState([]);
  const selectAllRef = useRef(null);
  const keys = useMemo(() => rows.map((row, index) => rowKey(row, index)), [rows, rowKey]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selected.length > 0 && selected.length < keys.length;
    }
  }, [selected.length, keys.length]);

  const publishSelection = next => {
    setSelected(next);
    onSelectionChange?.(next);
  };

  const toggle = key => publishSelection(
    selected.includes(key) ? selected.filter(item => item !== key) : [...selected, key],
  );
  const toggleAll = () => publishSelection(selected.length === keys.length ? [] : keys);

  return (
    <div className={`ax-tablewrap ${className}`}>
      <table className="ax-table">
        {caption ? <caption className={captionHidden ? "ax-sr-only" : undefined}>{caption}</caption> : null}
        <thead>
          <tr>
            {selectable ? (
              <th scope="col" style={{ inlineSize: 36 }}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={selected.length === keys.length && keys.length > 0}
                  onChange={toggleAll}
                  aria-label={labels.selectAll}
                />
              </th>
            ) : null}
            {columns.map(column => {
              const sortState = column.sortable ? (column.sort ?? "none") : undefined;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={sortState}
                  className={column.numeric ? "ax-td-num" : undefined}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className="ax-table__sort"
                      onClick={() => onSort?.(
                        column.key,
                        column.sort === "ascending" ? "descending" : "ascending",
                      )}
                    >
                      {column.label}
                    </button>
                  ) : column.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const key = rowKey(row, index);
            const state = rowState?.(row);
            const identity = rowLabel ? rowLabel(row) : String(key);
            return (
              <tr
                key={key}
                aria-selected={selected.includes(key) || undefined}
                className={state === "failed" ? "is-row-failed" : undefined}
              >
                {selectable ? (
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(key)}
                      onChange={() => toggle(key)}
                      aria-label={`${labels.selectRow} ${identity}`}
                    />
                  </td>
                ) : null}
                {columns.map(column => (
                  <td key={column.key} className={column.numeric ? "ax-td-num" : undefined}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
