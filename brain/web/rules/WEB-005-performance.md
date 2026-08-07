# WEB-005 — Performance Law

> Status: **BINDING**.
> Measured, not asserted. Every task records numbers before and after.

---

## 1. Budgets

| Metric | Budget | Fails at |
| --- | --- | --- |
| First-load JS, any route | ≤ 110 KB gzip | 130 KB |
| Shared chunk growth per task | 0 KB | +15 KB without a tracker entry |
| LCP (mid-tier Android, 4G throttle) | ≤ 2.0 s | 2.5 s |
| INP | ≤ 150 ms | 200 ms |
| CLS | ≤ 0.02 | 0.05 |
| TBT | ≤ 150 ms | 200 ms |
| Global CSS shipped per route | ≤ 40 KB | 60 KB |
| Route segment `page.js` payload | ≤ 25 KB gzip | 40 KB |

Field surfaces (`/field/**`) are held to the stricter half of every budget. They
run on a phone, on a plant floor, on a degraded network.

---

## 2. The biggest lever: send less JavaScript

In order of impact for this codebase:

1. **Server Components.** Every component moved off the client is bundle removed
   outright, not deferred. This is the primary tool.
2. **Split the giant client files.** `Workspace.tsx` (136 KB source),
   `Startup.tsx` (85 KB), `operations/page.tsx` (79 KB), `ReviewClient.tsx`
   (53 KB), `ShellClient.tsx` (45 KB) currently dominate their routes. Each
   becomes a server-rendered composition plus small client islands.
3. **Dynamic-import the heavy libraries.** `mapbox-gl`, `leaflet`,
   `react-leaflet`, `three`, `twilio-video` must never appear in a shared chunk
   or in a route that does not render them. They load through
   `next/dynamic` with `ssr: false` and a token-sized skeleton, triggered when
   the user reaches the feature — not when the shell mounts.
4. **Named imports only.** `import { Factory } from "lucide-react"`, never a
   namespace import. No deep-import of an entire icon set, chart library, or
   locale bundle.
5. **No polyfills for browsers we do not support.** Target is evergreen.

---

## 3. CSS

- `saqeel-runtime.css` (≈ 170 KB) and `saqeel-components.css` (≈ 50 KB) are
  **frozen**. Nothing is added to either.
- Every migrated screen deletes the classes it exclusively owned from those
  sheets. **Bytes removed is a tracked deliverable of every task.**
- New styling is CSS Modules, colocated, route-scoped by construction.
- `tokens.css` stays global and small; it is the only sheet loaded everywhere.
- No `@import` chains. No unused keyframes. No duplicated resets.

---

## 4. Images and media

- `next/image` for every raster asset, with explicit `sizes`, correct
  `width`/`height`, and modern formats.
- `priority` on exactly one element per route — the LCP element — and never more.
- Evidence photos are served at the size actually rendered, not full capture
  resolution, with a blur placeholder to hold layout.
- SVG illustrations (not icons) are static assets referenced by `next/image`,
  never inlined into a component.
- Video and 3D assets load on interaction only.

---

## 5. Fonts

- `next/font/local` for the self-hosted IBM Plex Sans Arabic set.
- Only the weights actually used are shipped. Every additional weight is ~45 KB;
  four are currently loaded and each must justify itself.
- `display: swap`, preloaded, subset where the character set allows.
- No webfont `@import`, no external font CDN, no FOIT.

---

## 6. Data and rendering

- Static or `revalidate`-cached wherever the data permits; `force-dynamic` is a
  last resort and is recorded (WEB-001 §5).
- No request waterfalls: independent queries run under `Promise.all`.
- Lists over 100 rows paginate or virtualise on the server. Never ship 5,000
  rows to the client to filter them there.
- `<Suspense>` around anything slow so the shell paints immediately.
- Prefetch on hover/viewport for the primary navigation only; blanket
  prefetching of every link on a dense board is a network attack on your own
  users.

---

## 7. Third-party

- No analytics, tag manager, chat widget, or A/B script in the critical path.
- Anything third-party loads `afterInteractive` or `lazyOnload`, and its cost is
  recorded.
- No third-party CSS.

---

## 8. Measurement — mandatory, per task

Before and after every task, record in the session neuron:

```
Route: /operations
first-load JS   412 KB → 96 KB   (-316 KB)
route CSS       218 KB → 31 KB   (-187 KB)
LCP (4G, mid)   4.8 s  → 1.6 s
INP             340 ms → 90 ms
CLS             0.14   → 0.01
client islands  1      → 3 (each < 120 lines)
legacy CSS deleted: 412 lines from saqeel-runtime.css
```

### The agent never runs the production build

`npm run build`, `next build`, and any other full production compile are **owned by the
human**. An agent must not run them. They take minutes, they contend with the running dev
server over `.next`, and a half-finished build leaves a corrupted cache that costs more
time than the measurement was worth.

So the measurement protocol splits:

**The agent produces the measurement request** — a short block at the end of its report
naming the exact routes to measure and the exact numbers to capture:

```
Measure before merging — routes touched: /operations, /operations/[id]
  npm run build            → First Load JS for both routes
  npm run perf:lighthouse  → LCP, INP, CLS on /operations
  npm run perf:bundle      → shared chunk delta
```

**The human runs it and pastes the numbers back.** The agent then fills them into the task
record. Until they arrive, the record's Numbers block reads `pending measurement` and the
task stays `in-progress`.

Everything else the agent verifies itself: `npm run typecheck`, `npm run lint`,
`npm run gates`, and the feature exercised by hand in the running dev server.

A task without numbers is not finished. "Feels faster" is not a measurement.

---

## 9. Regressions

- Any route that grows past its budget blocks the merge.
- A budget can only be raised by a tracker entry that states the user-visible
  benefit bought with those bytes, signed off by the owner.
- The build prints the budget table on every run so a regression is visible the
  moment it appears, not a month later.
