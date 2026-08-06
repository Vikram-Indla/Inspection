# WEB-004 — State & Effects Law

> Status: **BINDING**.
> Default position: **this component has no state.** State is a cost — in
> bundle size, in hydration time, in bugs, in the number of things a future
> reader must hold in their head. Every piece of it must be argued for.

---

## 1. The state ladder

Before writing `useState`, walk down this ladder and stop at the first rung that
works. Skipping a rung requires a recorded reason in the tracker task.

1. **Server data.** Can the server already know this? Then it is a query result,
   not state.
2. **URL state.** Is it a tab, a filter, a sort, a page, a selected id, a search
   term, an open panel that should survive a refresh? Then it belongs in
   `searchParams`. Free benefits: shareable, bookmarkable, back-button correct,
   server-rendered, zero client JS.
3. **Derived value.** Can it be computed from props or existing state during
   render? Then compute it. It is not state.
4. **Uncontrolled DOM.** Is it an input the app only reads on submit? Then use
   `defaultValue` and `FormData`. A controlled input that re-renders a tree on
   every keypress is a performance defect wearing a React costume.
5. **`useState`.** Genuinely ephemeral, genuinely local, genuinely interactive.
6. **Context.** Only for values that are global, rarely changing, and needed at
   many depths: theme, locale, session identity, offline status. Never for data
   that could be passed two levels.

There is no rung 7. No Redux, no Zustand, no MobX, no TanStack Query. Server
state belongs to the server; local state is local.

---

## 2. State audit — the four questions

Every `useState` in a diff must have an answer to all four in the task log:

1. What single fact does this hold?
2. Who else could hold that fact instead? (server / URL / parent / DOM)
3. What breaks if it is stale or duplicated?
4. What is the one place that changes it?

If two variables can disagree with each other, they are one variable. If a piece
of state is only ever set from a prop, it is not state — it is the prop.

**Banned patterns:**

- state that mirrors a prop
- state derived from other state
- a boolean pair that encodes three states (`isLoading` + `isError` — use a
  discriminated union `status: "idle" | "loading" | "ready" | "failed"`)
- state that exists only to trigger an effect
- a `useState` whose setter is called exactly once, at mount

---

## 3. `useEffect` — banned by default

`useEffect` is an escape hatch for synchronising with something outside React.
It is not a lifecycle hook and it is not a place to put logic.

**Permitted, and only these:**

| Case | Requirement |
| --- | --- |
| Subscribing to an external store | prefer `useSyncExternalStore` |
| Browser event listeners (`resize`, `online`, `visibilitychange`) | must clean up |
| Imperative library handoff (Leaflet, Mapbox, Three, Twilio, canvas, media) | must dispose |
| Focus management an overlay cannot express declaratively | must be scoped |
| Analytics page-view emission | one call site only |

**Forbidden, always:**

- fetching data
- transforming props into state
- keeping two states in sync
- resetting state when a prop changes → pass a `key` instead
- computing something that could be computed in render
- calling a parent's callback with derived state
- an empty-dependency effect that just "runs once"

Every permitted effect has a cleanup function unless it provably needs none, and
its dependency array is complete and honest. A dependency array trimmed to stop
a loop is a bug being hidden.

---

## 4. Forms

- Server actions plus `useActionState` are the default. `useFormStatus` renders
  the pending state.
- Inputs are uncontrolled unless a field genuinely drives other UI while typing.
- Validation runs with the same schema on the client (for immediate feedback)
  and on the server (for truth). The server is authoritative.
- `useOptimistic` for optimistic updates, always with a defined rollback and a
  visible failure state.
- Multi-step wizards keep step state in the URL, not in a giant client object.
  A refresh mid-wizard must not lose the inspector's work.

---

## 5. Offline and field surfaces

This app is a PWA used where connectivity fails. That does not license a client
state machine sprawling across components.

- Offline queue, draft persistence, and sync status live in **one** module under
  `lib/offline/` with a typed public API and a single subscription point.
- Components read sync state through `useSyncExternalStore` on that module.
  They never own their own copy.
- Every queued mutation is idempotent and carries a client-generated id.
- Sync status is always visible and always announced (WEB-003 §6).
- Draft data is written on a schedule the user can rely on and its last-saved
  time is displayed.

---

## 6. Memoisation

- Do not reach for `useMemo`, `useCallback`, or `memo` reflexively. React 19's
  compiler and the small size of a correctly-scoped client island make most of
  them noise that costs more than it saves.
- Use them when a measurement says so: an expensive computation (> 1 ms), a
  referentially-stable dependency of a permitted effect, or a genuinely large
  list. Record the measurement in the task.
- A `useMemo` with no measurement behind it is deleted in review.

---

## 7. Client component budget

- A client component that is over 150 lines is doing too much; extract the
  static parts back to the server.
- A route may not exceed **four** client component instances in its first paint
  without an entry in the tracker explaining why.
- `"use client"` at the top of a file that contains no hooks and no handlers is
  deleted.
- Passing a server-rendered subtree as `children` through a client boundary is
  the preferred way to keep a client island small. Use it.

---

## 8. The review questions

For every diff that touches state:

- [ ] Could any of this be server data or URL state?
- [ ] Does any state duplicate another source of truth?
- [ ] Does every effect subscribe to something genuinely outside React?
- [ ] Does every effect clean up?
- [ ] Is any state derivable during render?
- [ ] Would deleting this state break anything a user can observe?
