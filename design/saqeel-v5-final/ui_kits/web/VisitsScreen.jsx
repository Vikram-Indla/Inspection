const { CommandBar, SearchInput, FilterChip, Button, DataTable, BulkBar, Lozenge, Segmented, Pagination } = window.SaqeelDesignSystem_49c57d;
const ROWS = [
  { id: "VIS-2026-004821", name: "Gulf Steel Works", region: "Riyadh", type: "periodic · physical", inspector: "m.qahtani", plan: "Published", tone: "success", date: "2026-07-21" },
  { id: "VIS-2026-004818", name: "Al Amal Plastics", region: "Riyadh", type: "follow-up · physical", inspector: "s.otaibi", plan: "Assigned", tone: "info", date: "2026-07-22" },
  { id: "VIS-2026-004816", name: "Najd Food Industries", region: "Qassim", type: "periodic · virtual", inspector: "—", plan: "Draft", tone: undefined, date: "2026-07-24" },
  { id: "VIS-2026-004812", name: "Eastern Cement Co.", region: "Dammam", type: "immediate · physical", inspector: "a.shammari", plan: "In progress", tone: "warning", date: "2026-07-20" },
  { id: "VIS-2026-004807", name: "Hail Polymer Works", region: "Hail", type: "periodic · physical", inspector: "m.qahtani", plan: "Failed to assign", tone: "critical", date: "2026-07-20", failed: true },
];
function VisitsScreen({ onOpenReview }) {
  const [selected, setSelected] = React.useState([]);
  return <>
    <CommandBar end={<><Button variant="secondary">Export</Button><Button>Plan visits</Button></>}>
      <SearchInput placeholder="Search visit, factory, CR…" />
      <FilterChip active>Region: Riyadh ✕</FilterChip>
      <FilterChip active>Window: next 14 days ✕</FilterChip>
      <FilterChip>+ Add filter</FilterChip>
      <Segmented options={["Table", "Board", "Map"]} defaultValue="Table" />
    </CommandBar>
    {selected.length ? <BulkBar count={selected.length}><Button variant="secondary">Assign inspector</Button><Button variant="secondary">Reschedule</Button><Button variant="secondary">Export</Button></BulkBar> : null}
    <DataTable selectable onSelectionChange={setSelected} rowState={r => r.failed ? "failed" : undefined}
      columns={[
        { key: "id", label: "Visit", render: r => <a href="#" onClick={e => { e.preventDefault(); onOpenReview(r); }} style={{ fontFamily: "var(--ax-font-mono)", fontSize: 14 }}>{r.id}</a> },
        { key: "name", label: "Factory" },
        { key: "region", label: "Region" },
        { key: "type", label: "Type" },
        { key: "inspector", label: "Inspector" },
        { key: "plan", label: "Planning", render: r => <Lozenge domain="plan" tone={r.tone}>{r.plan}</Lozenge> },
        { key: "date", label: "Scheduled", numeric: true }]}
      rows={ROWS} />
    <Pagination page={1} pages={9} />
  </>;
}
Object.assign(window, { VisitsScreen });
