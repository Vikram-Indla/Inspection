// Government Foundation V1 — fixed renderer colours for Mapbox, which cannot
// resolve CSS custom properties inside style expressions. This is the sole
// TypeScript colour-value exception: values mirror the governed semantic
// palette in tokens.css and keep maps aligned across field, admin and ops.
export const MAP_PALETTE = {
  high: { fill: "#B42318", stroke: "#7A271A" },
  medium: { fill: "#8A5A00", stroke: "#5F3D00" },
  low: { fill: "#18794E", stroke: "#0F5132" },
  neutral: { fill: "#175CD3", stroke: "#1849A9" },
  primary: "#176B52",
  info: "#175CD3",
  halo: "#FFFFFF",
} as const;
