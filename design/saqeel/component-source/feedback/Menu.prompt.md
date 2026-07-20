Overflow/context menu — row actions, split-button menus, user menu content. Esc + outside-click close.

```jsx
<Menu align="end" trigger={<Button variant="ghost" iconOnly aria-label="Row actions">⋯</Button>}
  items={[{label:"Reassign"},{label:"Change due date"},"sep",{label:"Cancel inspection",danger:true}]} />
```
