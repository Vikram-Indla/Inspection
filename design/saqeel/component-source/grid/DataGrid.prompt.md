The flagship Inspection Data Grid: sticky header, pinned ID column, multi-sort (shift-click), selection with bulk bar, row expansion, inline actions, two densities, footer pagination, loading/empty/error states. Pass a windowed row slice for virtualised datasets — the grid renders only what it receives.

```jsx
<DataGrid selectable density="compact"
  columns={[
    { id: "id", header: "Inspection", pinned: true, sortable: true, cell: r => <span className="id-code">{r.id}</span> },
    { id: "facility", header: "Facility", truncate: true, sortable: true },
    { id: "status", header: "Status", cell: r => <StatusBadge status={r.status} /> },
    { id: "due", header: "Due", sortable: true, numeric: true },
  ]}
  rows={rows} selected={sel} onSelect={setSel} sort={sort} onSort={setSort}
  toolbar={<><Input type="search" placeholder="Search register" /><Button variant="secondary" size="sm">Filters</Button></>}
  bulkActions={<Button variant="secondary" size="sm">Assign</Button>}
  page={1} pageCount={42} total={2084} onPage={setPage} />
```
Rules: no per-row card styling; header stays ≥ 4.5:1; hidden actions forbidden — inline actions or an explicit ⋯ menu; truncated cells get title tooltips. RTL works out of the box (logical properties).