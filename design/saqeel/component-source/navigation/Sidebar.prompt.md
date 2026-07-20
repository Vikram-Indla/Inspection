Persistent graphite application sidebar; collapsed mode keeps icons + tooltips. Same graphite in light and dark themes.

```jsx
<Sidebar activeId="inspections" collapsed={isCompact} onNavigate={go}
  groups={[{ label: "Operations", items: [{ id: "inspections", label: "Inspections", count: 128 }] }]} />
```
