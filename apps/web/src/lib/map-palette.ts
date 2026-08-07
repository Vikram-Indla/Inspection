// Fixed renderer colours for Mapbox, which cannot resolve CSS custom
// properties inside style expressions. This is the sole TypeScript colour
// exception: the values mirror the governed semantic palette in saqeel.css
// and keep maps aligned across field, admin and ops.
//
// Repointed to the IRP palette 2026-08. The risk ramp is the status ramp:
// high = error, medium = warning, low = success. Green survives on `low`
// precisely because low risk IS the compliant state — it is the same
// semantic as a success pill, not a decorative choice. `neutral` was blue,
// which now means info; an unclassified zone is grey. `primary` was the old
// emerald brand and is now aubergine.
export const MAP_PALETTE = {
  high: { fill: "#B71D18", stroke: "#7A0916" },
  medium: { fill: "#B76E00", stroke: "#7A4100" },
  low: { fill: "#118D57", stroke: "#065E49" },
  neutral: { fill: "#637381", stroke: "#454F5B" },
  primary: "#413259",
  info: "#215C66",
  halo: "#FFFFFF",
} as const;
