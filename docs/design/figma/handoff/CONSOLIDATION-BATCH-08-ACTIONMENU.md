# Batch 08 — ActionMenu, and closing the section-title type gap

Two library items. Both uncontested — the component page is the one area no other workstream is
editing.

## `t-eyebrow` — a ramp step that was never registered

`section-title` renders **12 / SemiBold / 145%** and carried **no text style**, on every screen
in the file, EN and AR. It has shown up as "unstyled text" in every verification I have run.

The obvious fix — apply an existing style — is **wrong**. Nothing matches:

| Candidate | Size | Weight | Line height |
|---|--:|---|--:|
| `t-label` | 12 | Medium | 135% |
| `t-meta` | 12 | Regular | 140% |
| **`section-title` actual** | **12** | **SemiBold** | **145%** |

Applying either would change weight and line height on every screen. So this was never a
missing style *application* — it was a **missing ramp step**. Registered as `t-eyebrow` and
`t-eyebrow-ar`, matching what already renders.

**Verified inert:** the `section-title` text measured `42 × 17` before and `42 × 17` after,
same size, same weight. Zero visual change by construction.

## `ActionMenu` — the last unbuilt classification row

The screen classification listed three reusable-component concepts: Modal (covered), Alerts
(covered), and **Actions — build**. This is that build.

| | |
|---|---|
| Node | **`344:156`** on `Domain: Inspection` |
| Variants | `Items=2 \| 3 \| 4` |
| Consolidates | `1509:70879` (240×200), `1434:142950` (296×256), `1632:211477` (240×144) |
| Dependencies | `Badge` `9:25` |
| Tokens | `surface-raised`, `border-subtle`, `text-primary` |

Item labels are the source menus' own: view visit report, previous violations, previous visits,
start an inspection plan. Counts (`28`, `40`) render as `Badge Status=Info` because the source
showed them — they are data, and where a menu has no count the badge is absent rather than
zeroed.

**Two defects in my own build, fixed before commit:**

| Defect | Cause | Fix |
|---|---|---|
| Menu surface rendered mid-grey | bound to `surface-overlay`, which is the scrim token, not a panel surface | `surface-raised` — a floating menu sits above the page |
| No variant showed a count | the counted items sat at indices 5–6, past the 4-item maximum | reordered so counts appear from `Items=2` |

## Classification status

With this, **every reusable-component row in the source classification is built or confirmed
covered.** The remaining unbuilt rows are all either merged into governed screens, reference-only,
obsolete, or blocked on the route-shape decision.
