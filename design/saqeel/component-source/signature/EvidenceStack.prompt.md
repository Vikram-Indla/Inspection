SAQEEL signature — evidence is never a bare thumbnail: every item carries capture time, coordinates, inspector, linked finding and verification status. Variants: list (default), detailed (+provenance), grid, compact.

```jsx
<EvidenceStack variant="detailed" onOpen={view} items={[{
  kind: "photo", caption: "Blocked exit, warehouse B", time: "20 Jul 13:58",
  inspector: "A. Al-Zahrani", coords: "24.7136° N, 46.6753° E",
  violation: "VIO-2026-0122", verification: "verified",
  provenance: "Captured on device TAB-114 · SHA-256 sealed",
}]} />
```
