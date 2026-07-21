Map panel; pins need provenance kind + label, decorative pins prohibited.

```jsx
<MapPanel pins={[{ x: "40%", y: "45%", kind: "official", label: "Official" }, { x: "55%", y: "60%", kind: "observed", label: "Observed" }]} geofence={{ x: "40%", y: "45%", r: 70 }} chrome={<Freshness state="live">Live</Freshness>} />
```