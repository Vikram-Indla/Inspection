import React from "react";
// Recreated verbatim from apps/web/src/components/ShellClient.tsx + app/icons.tsx
const P = {
  dashboard:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  radar:<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6M12 3v2M21 12h-2"/></>,
  factory:<><path d="M3 21V9l6 3V9l6 3V5h6v16z"/><path d="M7 17h2M13 17h2M18 9h3"/></>,
  calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/></>,
  visits:<><path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/></>,
  inspect:<><path d="M9 11l2 2 4-4"/><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></>,
  virtual:<><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M17 10l4-3v10l-4-3z"/></>,
  review:<><path d="M9 5h10v16H5V9z"/><path d="M9 5v4H5M9 14l2 2 4-4"/></>,
  admin:<><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12h6M12 9v6"/></>,
  library:<><path d="M4 4h6v16H4zM14 4h6v16h-6z"/><path d="M7 8h.01M17 8h.01"/></>,
  forms:<><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></>,
  enforcement:<><path d="M4 20h16M8 17l8-8M10 5l4 4M6 9l4 4"/></>,
  workflow:<><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M17 8l-4 8M7 8l4 8"/></>,
  risk:<><path d="M12 3l10 18H2z"/><path d="M12 9v5M12 18h.01"/></>,
  map:<><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></>,
  access:<><circle cx="9" cy="8" r="4"/><path d="M3 21v-2a6 6 0 0112 0v2M17 11h4M19 9v4"/></>,
  notify:<><path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 004 0"/></>,
  insights:<><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/><path d="m3 6 6-3 6 5 7-6"/></>,
  search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  lock:<><rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></>,
  close:<><path d="m6 6 12 12M18 6 6 18"/></>,
  menu:<><path d="M4 7h16M4 12h16M4 17h16"/></>,
  chevronDown:<><path d="M5 8.5l7 7 7-7"/></>,
  check:<><path d="m4.5 12.5 5 5L19.5 7"/></>,
  target:<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/></>,
  shield:<><path d="M12 3 5 6v5c0 4.6 3 8 7 10 4-2 7-5.4 7-10V6Z"/><path d="m9 11.5 2.2 2.2L15.5 9.5"/></>,
  eye:<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></>,
  video:<><rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10.5 5-3v9l-5-3"/></>,
  mapPin:<><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.6"/></>,
  fingerprint:<><path d="M12 11a2 2 0 0 1 2 2c0 2.5-.4 4.9-1.2 7"/><path d="M8.5 12.5A3.5 3.5 0 0 1 15.5 13c0 1.4-.1 2.7-.4 4"/><path d="M5.6 10.2A6.5 6.5 0 0 1 18.5 13c0 .8 0 1.6-.1 2.4"/><path d="M6.8 20a19 19 0 0 0 1.5-4"/><path d="M12 3.5a9 9 0 0 0-6.7 3"/><path d="M20.8 9A9 9 0 0 0 15 4"/></>,
  link:<><path d="M9.5 14.5l5-5"/><path d="M11 7.5l1.2-1.2a3.6 3.6 0 0 1 5.1 5.1L16 12.6"/><path d="M13 16.5l-1.2 1.2a3.6 3.6 0 0 1-5.1-5.1L7.9 11.4"/></>,
};
export function Icon({ name, size = 20, className }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{P[name] || null}</svg>;
}
