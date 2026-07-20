Ctrl/Cmd-K palette doubling as global search: commands + entities (inspections, facilities, permits) grouped by section, arrow/Enter/Esc keyboard model.

```jsx
<CommandPalette open={open} onClose={close} items={[
  { section: "Actions", label: "New inspection", kbd: "N" },
  { section: "Inspections", label: "INS-2026-004821 — Al Noor Food Processing", onSelect: go },
]} />
```
