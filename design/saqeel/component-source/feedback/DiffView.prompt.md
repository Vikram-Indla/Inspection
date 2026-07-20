Field-level diff (version comparison) and, with onKeep, the sync-conflict resolver. Deletion = critical-soft strikethrough; insertion = compliant-soft.

```jsx
<DiffView rows={[{ field: "Cold-room 2 temp", before: "7.4°C", after: "9.1°C", meta: "Edited offline · A. Al-Zahrani 13:41" }]} onKeep={resolve} />
```