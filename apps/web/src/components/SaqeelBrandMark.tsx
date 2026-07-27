// Saqeel canonical brand mark — shield with checkmark. This is the single
// authoritative logomark for the app: login lockup, console nav drawer
// header, the authenticated shell rail (ShellClient), and
// apps/web/src/components/saqeel/navigation/Sidebar.tsx default brandMark all
// render this exact path. Theme-adaptive through `currentColor` only (GLOBAL
// COLOR LAW) — callers set colour via a CSS class, never inline.
//
// Filled, not stroked. A 1.5px outline on a 24 viewBox is a ~1.75px hairline
// at rail size, which carries no optical mass beside a 600-weight wordmark and
// reads as one more nav icon rather than as identity. The silhouette is the
// same geometry as saqeel-favicon.svg, which is sponsor-approved.
//
// The check is a hole, not a second shape: one compound path with
// fill-rule="evenodd", so it is TRUE negative space and whatever sits behind
// the mark shows through. That is what lets the mark carry weight without a
// plate or a container patch behind it — the defect this replaced. Its outline
// is derived from the favicon's own check centreline (m8.9 11.85 2.25 2.25
// 4.3-4.95) at its stroke width of 2.6, so the two marks stay identical.
export default function SaqeelBrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" role="img" aria-label="Saqeel" fill="currentColor">
      {/* Scaled about centre: the bare silhouette spans y 3.4–20.4, so at rest
          it sits inside a box it does not fill. Nothing is cropped. */}
      <g transform="translate(12 12) scale(1.2) translate(-12 -12)">
        <path
          fillRule="evenodd"
          d="M12 3.4 5 6.05v5.4c0 5.2 3 7.9 7 8.95 4-1.05 7-3.75 7-8.95v-5.4L12 3.4Z
             M7.98 12.77 11.22 16.01 16.43 10 14.47 8.3 11.08 12.19 9.82 10.93Z"
        />
      </g>
    </svg>
  );
}
