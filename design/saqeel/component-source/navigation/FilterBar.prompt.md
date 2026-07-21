Grid filter bar: saved-view select + filter chips (dashed unset → solid emerald set) + advanced builder (FilterRule rows in a Drawer) + save view.

```jsx
<FilterBar savedViews={views} activeView={v} onView={setV}
  filters={[{id:"status",label:"Status",value:"Overdue"},{id:"region",label:"Region"}]}
  onOpenFilter={openF} onClearFilter={clearF} onAdvanced={openBuilder} onSaveView={save} />
```
