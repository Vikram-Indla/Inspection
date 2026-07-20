Page title block: breadcrumb above, title + meta line (ID, status), actions inline-end, optional tabs below.

```jsx
<PageHeader breadcrumb={<Breadcrumb items={[...]}/>} title="Inspection INS-2026-004821"
  meta={<><span className="id-code">INS-2026-004821</span><StatusBadge status="pending">Pending review</StatusBadge></>}
  actions={<Button variant="primary">Submit</Button>} />
```
