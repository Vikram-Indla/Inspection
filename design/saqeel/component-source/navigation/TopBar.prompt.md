The command bar: sidebar toggle + global search + notifications, language, theme and user controls.

```jsx
<TopBar start={<Button variant="ghost" iconOnly aria-label="Menu" icon={<MenuIcon/>}/>}
  search={<Input type="search" icon={<SearchIcon/>} placeholder="Search inspections, permits, facilities"/>}
  end={<><Button variant="ghost" iconOnly aria-label="Notifications" icon={<BellIcon/>}/><Avatar name="Ahmed Z"/></>} />
```
