# V4.1 component API matrix
| Component | File | A11y contract | Density | RTL | Print |
|---|---|---|---|---|---|
| Button | core/Button | aria-busy, visible loading label, disabledReason, danger gated | compact/default/prominent/field | logical | text |
| Field | core/Field | label-for + describedby + invalid + errormessage auto-wired | web/field | logical | n/a |
| Tabs / RouteTabs | core/Tabs | full ARIA tabs (roving, RTL arrows, panels) / links no roles | — | arrow-flip | n/a |
| Modal | overlays/Modal | labelledby/describedby, close, Esc, trap, restore | — | logical | hidden |
| Drawer | overlays/Drawer | labeled dialog, modal/non-modal, restore | — | inline-end | hidden |
| Pagination | core/Pagination | localized prev/next/page names, aria-current | 40px targets | chevrons flip | n/a |
| DataTable | data/DataTable | caption, sort buttons + aria-sort, rowLabel names, indeterminate | compact/standard | text-align start/end | thead repeats |
| SearchInput | core/SearchInput | canonical SVG icon; combobox pattern documented | 38–40px | logical | hidden |
| StatusRail · MetricStrip · StatusChip · TonalField · RecordRow · ControlGroup · DateTime · DateRange · Signature · ReportHeader · ReportFooter · FieldActionBar · CommandHeader · PageHeader · AdminFilterToolbar | patterns2/* | see .d.ts/.prompt.md — nav landmarks, fieldset+legend, bdi isolation, aria-selected rows | per spec | logical + bdi | Signature keep-together; Report* = running header/footer |
Existing retained: Icon, Lozenge (domain glyphs), SyncChip, Freshness, Banner, Toast, Skeleton, StateCard, Menu, Tooltip, CommandBar, FilterChip, BulkBar, Stepper, Timeline, Breadcrumb, ValidationSummary, ConflictResolver, DiffText, VisitCard, EvidenceCard, MapPanel, RuleRow, WidgetFrame, Accordion, Segmented, Checkbox, Radio, Switch, Input, Select, Textarea, SplitButton, KpiCard (V2), Avatar, VersionBadge, Badge. Deprecated for lists: TypeCards.