# WEB-001 — Architecture & Next.js Law

> Status: **BINDING**. App Router, Next.js 15, React 19, TypeScript strict.
> Target: an architecture that a stranger can extend correctly in 2046.

---

## 1. The governing idea

Ship as little JavaScript to the browser as the feature allows. Everything else
follows from that: server components by default, client islands at the leaves,
data fetched on the server, cache posture declared explicitly, heavy libraries
loaded only when the user reaches the screen that needs them.

---

## 2. Route files are composition only

`page.tsx`, `layout.tsx`, `template.tsx`, `default.tsx`, `loading.tsx`,
`not-found.tsx` contain **zero client code and zero logic**. Hard ceiling 40
lines (WEB-000 §1).

Permitted in a route file:

- `export const metadata` / `generateMetadata`
- `export const revalidate` / `dynamic` / `dynamicParams`
- reading `params` and `searchParams`
- awaiting one or more calls into `features/<domain>/queries.ts`
- rendering named components and passing them props

Banned in a route file:

- `"use client"` — see the single carve-out below
- any React hook
- any inline event handler
- any `.map` / `.filter` / conditional rendering beyond a top-level guard
- any Supabase client, `fetch`, or SQL
- any JSX that styles anything
- any string that a user will read (those come from i18n)

The shape every page converges on:

```tsx
import { PlanningBoard } from "@/components/planning/PlanningBoard";
import { listPlanningCycles } from "@/features/planning/queries";
import type { PlanningSearchParams } from "@/features/planning/types";

export const revalidate = 60;

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<PlanningSearchParams>;
}) {
  const cycles = await listPlanningCycles(await searchParams);
  return <PlanningBoard cycles={cycles} />;
}
```

**The single carve-out**: `error.tsx` and `global-error.tsx` must be client
components by Next.js's own contract. They carry `"use client"`, they render one
named component, and they contain nothing else.

---

## 3. Server-first, client at the leaf

- Every component is a Server Component unless it provably cannot be.
- `"use client"` is only legitimate for: DOM event handlers, browser-only APIs
  (`window`, `navigator`, `IndexedDB`, geolocation, media capture), React state
  or refs that survive interaction, and third-party libraries that require the
  DOM (Leaflet, Mapbox, Three, Twilio).
- The directive goes on the **smallest possible subtree**. A page does not
  become a client component because one button inside it is interactive; the
  button becomes a client component.
- Interactive shells accept server-rendered children:
  `<Disclosure>{serverRenderedPanel}</Disclosure>`. Passing children through a
  client boundary keeps them on the server. Use it constantly.
- Every new `"use client"` is recorded in the tracker task with its one-line
  justification. A client boundary with no recorded reason is removed.
- Client components never import from `features/*/queries.ts`.

---

## 4. Data access

All reads live in `features/<domain>/queries.ts`. All writes live in
`features/<domain>/actions.ts`. No exceptions, no "quick inline query".

```ts
export const listOverdueVisits = cache(async (regionId: RegionId): Promise<VisitSummary[]> => {
  const client = createServerClient();
  const { data, error } = await client.from("visits").select(VISIT_SUMMARY_COLUMNS).eq("region_id", regionId);
  if (error) throw new VisitQueryError("listOverdueVisits", regionId, error);
  return data.map(toVisitSummary);
});
```

Rules:

- `cache()` wraps every query so a value fetched twice in one render is fetched
  once.
- Select explicit columns. `select("*")` is banned.
- The database row shape never leaves `features/**`. `mappers.ts` converts it to
  a view model; components only ever see view models.
- Pagination and filtering happen in the query, never by fetching everything and
  slicing in the component.
- No waterfalls. Independent queries run under `Promise.all`.
- No client-side fetching for first paint. Ever.

### Mutations

```ts
"use server";

export async function submitFinding(_: FindingFormState, formData: FormData): Promise<FindingFormState> {
  const parsed = FindingInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "invalid", fieldErrors: parsed.error.flatten().fieldErrors };
  await persistFinding(parsed.data);
  revalidateTag(visitTag(parsed.data.visitId));
  return { status: "saved" };
}
```

- Every server action parses its input with a schema before touching data.
- Every server action re-checks authorisation server-side. The UI hiding a
  button is not authorisation.
- Every server action revalidates the tags it invalidated.
- Server actions return a typed result state. They never throw for user error.

---

## 5. Caching — declared, never accidental

Every query declares exactly one posture. An undeclared posture fails review.

| Posture | Use for | How |
| --- | --- | --- |
| `static` | reference data, regulations, taxonomies | default fetch cache; no dynamic APIs in the segment |
| `revalidate(n)` | dashboards, boards, lists | `export const revalidate = n` on the segment |
| `tag(...)` | anything a mutation can change | `unstable_cache(fn, keyParts, { tags })` + `revalidateTag` |
| `dynamic` | per-user, per-request, auth-gated | `export const dynamic = "force-dynamic"`, documented in the task |

Tag naming is fixed in `features/<domain>/keys.ts`:

```ts
export const visitTag = (id: VisitId) => `visit:${id}`;
export const visitListTag = (regionId: RegionId) => `visit:list:${regionId}`;
```

- `force-dynamic` on a whole segment because one widget is personal is a defect.
  Isolate the personal widget behind `<Suspense>` instead.
- `router.refresh()` is not a cache strategy.
- Every task records which routes changed cache posture and why.

---

## 6. Streaming and loading

- Every route segment that awaits data has a `loading.tsx` rendering the
  **skeleton of the real layout**, not a spinner in the middle of the page.
- Slow, non-critical subtrees (maps, charts, AI panels, activity feeds) sit
  inside `<Suspense>` with their own skeleton so the shell paints immediately.
- Skeletons match the final geometry to keep CLS at zero.
- No layout shift when data arrives. If the height is unknown, reserve it.

---

## 7. Route structure

- Existing routes are fixed and must not be renamed, added to, or nested:
  `/dashboard` `/operations` `/factories` `/planning` `/execution` `/reviews`
  `/compliance` `/compliance/approvals` `/enforcement-library` `/analytics`
  `/admin/*` `/field/*`.
- Tabs, filters, sort, and pagination are **query state**, never subroutes.
  They live in `searchParams`, which makes every view linkable, shareable,
  back-button-correct, and server-renderable.
- Route groups `(app)`, `(auth)` express shell variants only.
- Parallel and intercepting routes only where the product genuinely needs a
  modal-over-a-page; never as a clever trick.
- `middleware.ts` does auth redirection and locale/dir resolution. Nothing else.
  No data fetching, no business rules.

---

## 8. Framework primitives that are mandatory

| Instead of | Use | Why |
| --- | --- | --- |
| `<a href="/x">` | `next/link` | client-side transition, prefetch |
| `<img>` | `next/image` | sizing, format negotiation, no CLS |
| webfont `@import` / `<link>` | `next/font/local` | no FOUT, no render-blocking request |
| `useRouter().query` | `searchParams` prop | server-renderable, no hydration cost |
| `process.env.X` inline | `lib/env.ts` validated once | a missing variable fails at boot, not in production |

Route handlers (`app/api/**`) exist for webhooks, third-party callbacks, and
non-HTML responses only. The app never calls its own route handler to get data
it could read directly on the server.

---

## 9. Internationalisation and direction

- No user-visible string literal in any component. Every string is an i18n key.
- Arabic content lives in i18n resources, never inside a component.
- Direction is handled with CSS logical properties only: `padding-inline`,
  `margin-inline-start`, `inset-inline-start`, `border-inline-end`, `text-align:
  start`. `left`/`right`/`margin-left` are banned in application CSS.
- No `[dir="rtl"]` override that flips a physical value. If you need one, the
  original property was physical and is the actual bug.
- Numerals, dates, and currency go through the shared formatters in `lib/`,
  never through ad-hoc `toLocaleString` calls scattered in components.

---

## 10. Security baseline

- Authorisation is enforced server-side on every query and every action.
- The Supabase service role key never reaches a client component or a browser
  bundle. `NEXT_PUBLIC_*` is a public commitment; treat it as printed on a
  billboard.
- No `dangerouslySetInnerHTML`. If content must be rich, it is parsed to a
  typed node tree and rendered as components.
- User-supplied URLs are validated against an allowlist before becoming an
  `href` or an image `src`.
- No secrets, tokens, or personal data in `console`, in error messages returned
  to the client, or in analytics payloads.

---

## 11. Twenty-year test

Before merging any structural decision, answer:

1. If the design system is re-skinned, how many files change? (Should be: the
   token file and the primitive.)
2. If Supabase is replaced, how many files change? (Should be: `features/**`.)
3. If the icon library is replaced, how many files change? (Should be: one — the
   icon registry.)
4. If a new engineer is asked to add a column to a board, how many files must
   they read to do it safely? (Should be: three.)

Any answer that is "many" is the design defect this programme exists to remove.
