# WEB-010 — No Performance Debt, No Leaks

> Status: **BINDING**.
> Performance and lifecycle correctness are part of the definition of working
> code, not a later pass. We do not migrate the whole application at once — but
> **everything we touch leaves our hands optimised.** A screen is never revisited
> to fix a leak or a jank we introduced.

---

## 1 · The standing commitment

Every task in this programme ships work that is already fast. There is no
"optimise later" ticket, because the cost of writing it correctly the first time
is minutes and the cost of finding it six months later is days.

If a task cannot be done both correctly and efficiently in the time available,
the scope shrinks. The quality does not.

---

## 2 · Memory: every subscription is disposed

An effect that subscribes must return a cleanup. No exceptions.

| Acquired | Released in cleanup |
| --- | --- |
| `addEventListener` | `removeEventListener` — the same function reference |
| `setInterval` / `setTimeout` | `clearInterval` / `clearTimeout` |
| `ResizeObserver` · `IntersectionObserver` · `MutationObserver` | `.disconnect()` |
| `AbortController` for fetch | `.abort()` |
| Leaflet · Mapbox · Three · Twilio instances | the library's `remove()` / `dispose()` / `destroy()` |
| `requestAnimationFrame` | `cancelAnimationFrame` |
| Supabase realtime channel | `removeChannel()` |
| `createPortal` container created by hand | removed from the DOM |
| `URL.createObjectURL` | `URL.revokeObjectURL` |

Further, non-negotiable:

- **No state update after unmount.** An async call that resolves late must be
  aborted, or guarded by a flag the cleanup flips.
- **No listener registered on every render.** Dependency arrays are complete and
  honest; a listener re-bound each render is a leak in slow motion.
- **No module-level mutable state that grows.** A cache is bounded and has a TTL.
- **A closed overlay unmounts.** Hiding a still-mounted panel with CSS keeps its
  timers, observers and subscriptions alive.

---

## 3 · Rendering: nothing does work it does not need to

- **Server Components by default.** The fastest client component is the one that
  was never sent (WEB-001 §3).
- **No derived state.** Compute during render; do not mirror props into state and
  re-render to sync them.
- **Lists render `key` from a stable id**, never an array index.
- **Lists over 100 rows** paginate or virtualise on the server. Never ship five
  thousand rows to filter them in the browser.
- **No work in render** that is not needed to produce the output — no `Date.now()`
  in a hot path, no re-sorting an unchanged array, no `JSON.parse` per row.
- **Heavy libraries are dynamically imported** and never enter a shared chunk:
  `mapbox-gl`, `leaflet`, `three`, `twilio-video`.
- Memoise only with a measurement behind it (WEB-004 §6).

---

## 4 · Animation: compositor only

Animate **`transform` and `opacity`** and nothing else.

Never animate `width`, `height`, `top`, `left`, `inset`, `padding`, `margin`,
or `font-size` — each forces layout on every frame, on every element beneath it.

- `will-change` only on an element that actually animates, and only while it can.
- Any continuous animation is disabled under `prefers-reduced-motion: reduce`.
- No animation on an element that is offscreen or hidden.
- No JavaScript-driven animation loop where CSS can do it.

---

## 5 · Measurement: never in a loop

- Read layout (`getBoundingClientRect`, `offsetWidth`, `scrollHeight`) **once**,
  outside any loop, and never interleaved with writes — that is layout thrashing.
- Prefer `ResizeObserver` and `IntersectionObserver` over `scroll` and `resize`
  handlers. Where a scroll handler is unavoidable it is passive and throttled to
  a frame.
- Size and position through CSS where CSS can express it. JavaScript measurement
  is the last resort, not the first.

---

## 6 · Network

- No request waterfalls: independent reads run under `Promise.all`.
- Every query declares a cache posture (WEB-001 §5) — an uncached repeated read
  is a defect.
- Polling has an interval justified in the task, pauses when the document is
  hidden, and is cleared on unmount.
- No request fired on every keystroke. Debounce, and abort the previous one.
- Images through `next/image` with explicit `sizes`; `priority` on exactly one
  element per route.

---

## 7 · The review questions

Every diff answers all seven:

- [ ] Does every subscription, timer, observer and listener have a cleanup?
- [ ] Can any state update land after unmount?
- [ ] Is anything animated other than `transform` and `opacity`?
- [ ] Is layout read inside a loop, or interleaved with writes?
- [ ] Could any of this have stayed on the server?
- [ ] Does any list render without a stable key, or without a server-side bound?
- [ ] Did a heavy library enter a chunk that does not need it?

An unchecked box is a blocker, not a note.

---

## 8 · Why this is a rule and not advice

Performance debt is uniquely expensive because it is invisible until it is
everywhere. One leaked interval is nothing; four hundred screens each leaking one
interval is an application that has to be restarted. One animated `width` is
nothing; a table where every row animates its width is a phone that gets hot.

Neither of those is ever fixed by a "performance sprint" — they are fixed by
never being written. That is what this document is for.
