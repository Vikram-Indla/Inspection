Offline-first sync status pill — glyph + colour + label (never colour alone). Lives in the field taskbar and record headers; states are contractual (e2e-tested in the product).

```jsx
<SyncIndicator state="offline" detail="3 changes queued · last sync 13:41" />
<SyncIndicator state="syncing" label="جارٍ المزامنة" />
```
Conflict/failed pair with an Alert linking to the DiffView resolution panel.