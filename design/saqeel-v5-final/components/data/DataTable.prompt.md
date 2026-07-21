Data table.

```jsx
<DataTable selectable columns={[{ key: "name", label: "Factory" }, { key: "risk", label: "Risk", render: r => <Lozenge domain="ops" tone={r.tone}>{r.risk}</Lozenge> }, { key: "visits", label: "Visits", numeric: true }]} rows={rows} />
```