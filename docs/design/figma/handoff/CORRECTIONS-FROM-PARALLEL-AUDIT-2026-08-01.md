# Corrections from the six-workstream parallel audit

Six read-only agents re-verified this workstream's claims. They found errors in **five** of my
published documents. The most serious has been repeated in ten commits.

---

## C1 — "Jira: NONE FOUND" is **WRONG**. It was wrong from batch 01.

Every batch record, the frame register and the journey contract state that no Jira epic covers
the inspector and that every contract carries `NONE FOUND`. **That is false.**

`docs/design/figma/jira-backlog-keys.md` (committed **2026-08-01 01:18**, before my first batch)
records an inspector backlog of **19 stories and 82 sub-tasks — 101 issues** under
**epic INSP-5 (Execution — field)** and **epic INSP-3 (Factory 360)**.

`docs/design/figma/traceability/JIRA-COVERAGE-2026-08-01.md` opens by superseding the exact
claim I kept repeating:

> "This supersedes every earlier statement in this repo that Jira was unreachable and that
> `INSP-1` was the only issue key."

**The disproof was in the git log shown to me at session start:**

> `17d78c8f feat(field): build 4 inspector report flows from the MIM iPad Figma (INSP-558/573/578/583)`

I inherited "NONE FOUND" from an earlier register and never checked it, across ten commits.
Four of the five keys are also written into the route source files themselves.

### The real mapping

| Route / capability | Story |
|---|---|
| `/field/inspection/[id]` — chemical release · customs exemption · safety | **INSP-536 · INSP-538 · INSP-543** |
| `/field/inspection/[id]/statement` | **INSP-548** |
| `/field/inspection/[id]/results` — violation + signature | **INSP-568** |
| `/field/summons-notices` | **INSP-558** |
| `/field/incident-reports` | **INSP-563** |
| `/field/sample-collection-reports` | **INSP-573** |
| `/field/destruction-reports` | **INSP-578** |
| `/field/facility-reports` | **INSP-583** |
| `/field/virtual`, `/field/virtual/[id]` | **INSP-553** |
| `/field/establishments`, `/field/factory-360/[id]` | **INSP-588** |
| `/field/establishments/unregistered` | **INSP-605** |
| `/field/[visitId]` + workspace offline | **INSP-593** |
| `/field/[visitId]/travel` — geofence / GPS override | **INSP-599** |
| Factory 360 identity · health score · penalties | **INSP-617 · INSP-622 · INSP-628** |
| Delegated execution — **no route shipped** | **INSP-611** |

Only **INSP-611** has no shipped route. The inspector channel is **almost fully storied**; my
documents said the opposite.

---

## C2 — Reachability was wrong in both directions

I published "29 reachable, 7 unreachable". Transitive closure from the shipped shell nav gives
**22 reachable, 14 unreachable**.

**`/field/incident-reports` is reachable** — I listed it as unreachable. It is linked from the
inspection workspace: href built at `app/(app)/field/inspection/[id]/page.tsx:192`, rendered at
`:810`, passed as `incidentHref` at `:802`.

**Eight routes I missed entirely:**

| Route | Why unreachable |
|---|---|
| `/field/feedback` | zero inbound |
| `/field/reports` | zero inbound |
| `/field/virtual` | only inbound is the back-link from its own child — a cycle |
| `/field/completed` | same cycle |
| `/field/feedback/rate/[visitId]`, `/field/reports/[id]`, `/field/virtual/[id]`, `/field/completed/[id]` | reachable only from those dead parents |

`/field/reports/[id]` is a **13-line redirect stub** to the web route — counting it as an
inspector screen overstates the surface by one.

The six original unreachable routes hold.

---

## C3 — "11 governed contracts / 10 governed and reachable" is unsupported

`screen_route_catalogue.csv` has **38 rows and not one `/field` route**. Its inspector rows are
the legacy `/ipad/*` contracts. Under a strict definition the governed-and-reachable set is
**2** — `SCR-FLD-600 → /field/my-tasks` and `SCR-FLD-630 → /field/inspection/[id]`. My 11 and 10
mixed governed contracts with proof-of-destination stubs.

**And 15 of 38 catalogue routes (39%) do not exist in the app** — not only the 8 iPad rows, but
`/admin/packages/:id/designer`, `/admin/penalties`, `/admin/workflows/:id`, `/planning/:id/review`,
`/factories/:id/360`, `/virtual/appointments/:id`, `/virtual/sessions/:id/verify`.

The catalogue has **4 commits ever**, last touched 2026-07-15. The Figma frame renames of
2026-08-01 were never mirrored into it — design and contract are actively divergent.

**The requirement corpus cannot arbitrate:** 9,604 rows across `REQUIREMENT_INDEX` and
`REQUIREMENT_TRACEABILITY` contain **zero route tokens**. `TRACEABILITY` contains "inspector"
**0** times while containing "ipad" 41 times — the two files use different channel vocabulary.

---

## C4 — I duplicated a frame that already existed

`SCR-FLD-630 — /field/inspection/[id]` exists at **`345:42290`**. `SCR-IPAD-630` at `305:40533`
is **the same repo route drawn twice**. There is a canonical `SCR-FLD-*` workstream with its own
disposition document (`ipad-web-disposition.md`) that I was not reading.

This is the fourth duplicate in this workstream — after `ChecklistQuestion`, `FileUpload`, and
`TaskCard`.

---

## C5 — 16 duplicate pairs inside the web master

Nine are hardcoded scaffold stubs later superseded by parameterised sets. They sort earlier by
node id, so a search for "dialog" or "sidebar" hits the stub first — the mechanism behind the
repeated re-builds.

**Actioned this batch** (renamed, never deleted): `grid-toolbar`, `thead`, `tr`, `sidebar`,
`topbar`, `Filter chip`, `Filter chip is-set` — all verified **0 instances**. `dialog` `15:30`
and `menu` `15:33` have 1 live instance each and carry a description pointer instead.

**Corrected the audit:** it named `Panel 11:45` a dead stub. It has **9 live instances**. Not touched.

**`FileUpload` collision resolved:** the domain wrapper `318:138` is renamed
**`EvidenceAttachment`**. Two published components sharing one name with different axes, while
`Dialog` bypassed the wrapper to instantiate `175:19` directly, was the unresolved half of the
earlier double-build.

---

## C6 — QA gaps found in library components

| Fix | Nodes | Verified |
|---|---|---|
| `App topbar` `EN` / `ع` / `MA` — 12/Bold, unregistered | → `t-eyebrow`, `t-eyebrow-ar` | 140 unstyled nodes retired |
| `SyncIndicator` glyphs — 11px, off-ramp | → `t-caption` 11.5 | inert |
| `ComplianceScore` — 16px, off-ramp | → `t-section` 17 | 6 nodes |

**Left deliberately:** the notification-count `4` at 10px. There is **no registered 10px style**,
and `Badge` also renders 10 — one decision covering two components, not a silent local fix.

**Not touched:** 36 unbound fills in the three governed reference sections. They are another
workstream's frames; per the ownership ruling they are preserved as reference.

**Clean:** 0 crunched, 0 clipped, 0 placeholder leakage, 0 colour-only status across all 61
frames and 11 component sets. Ungoverned EN/Dark/AR and all 30 state frames are 100% token-bound.

---

## C7 — Capability duplication: the business layer is fine, the presentation layer forked twice

- **Factory 360** — `/factories/cr/[id]` and `/field/factory-360/[id]` call the *identical*
  loader and destructure the *identical* result. One capability, two personas. The inspector
  Factory 360 has **zero design representation**.
- **Map** — `GeoMap` is canonical with 15 wrappers; `operations/live/LiveMapInner.tsx` is a
  second independent Mapbox implementation. **It logs the Mapbox token to the browser console
  at line 204** — flagged, not touched, as it is outside this workstream.
- **Evidence capture** — five representations of one control; three repo DS components have
  **zero consumers** because screens hand-rolled their own first.
- **`ChecklistQuestion` is the wrong model.** The repo component hardcodes
  `"compliant" | "violation" | "na"`; the governed contract is a per-item `response_model` from
  `inspection_items`. Nothing adopted it because adopting it would regress the screen. My
  redesign kept options as *content*, which is directionally right — but it still needs
  re-specifying against `response_model` before `Workspace.tsx` can consume it.

---

## What this changes

The inspector is **not** an ungoverned channel with no stories. It is a **storied channel with a
stale catalogue**: 101 Jira issues, 36 shipped routes, a catalogue that describes a URL space
that never existed, and a requirement corpus that cannot be joined to either.

Every "Jira: NONE FOUND" in this workstream's records should be read as **"not looked up"**.
