SAQEEL's strongest signature: the composed geospatial command surface. Slots: basemap (engine untouched — zone-hover elevation preserved), centered toolbar, layers+legend panel, selected-context panel, operational drawer, zoom/locate. Handles loading/empty/restricted states. Never tint the basemap; markers stay legible at operational zoom.

```jsx
<GeoWorkspace basemap={<MapEngine />} layers={layers} onToggleLayer={t}
  legendItems={[{tone:"critical",label:"Critical finding"},{tone:"info",label:"Vehicle"}]}
  contextPanel={<MapPanel title="Selected inspection">…</MapPanel>}
  zoom={{ onIn, onOut, onLocate }} state="ready" />
```
