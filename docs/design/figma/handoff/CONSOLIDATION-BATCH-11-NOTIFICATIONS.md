# Batch 11 — Notifications, and the audit fixes applied to the library

## Contract

| | |
|---|---|
| Frame | **`354:42408`** in `339:42098` |
| Name | `UNGOVERNED — Notifications — /field/notifications — INSPECTOR responsive · EN · Light` |
| Persona | Inspector |
| Repo route | `/field/notifications` — 451 lines, **reachable** from the taskbar and `NotificationBell` |
| Required states | empty, error, offline, permission |
| Dependencies | `NotificationRow` **`350:42575`**, `Alert` `11:43`, `seg-opt` `70:6`, `Button` `8:32` |
| Jira | **no story in the inspector backlog** — a real gap, now stated against a corrected baseline rather than assumed |

**Structure taken from the code's own comment.** `NotificationAttentionCenter.tsx:21-22` states
the screen is "three sections and nothing else: the two-chip filter segment, the row list
(icon tile · title + New badge · message · date line), and the empty state." The contract is
exactly that, plus the offline banner and the acknowledgement caveat the same file carries.

**Governed values not invented:** the date line renders `Not configured`, and the offline banner
says the cached time is not configured rather than inventing a timestamp.

## New component — `NotificationRow` `350:42575`

`Read=Unread | Read`. Icon tile · title · `New` badge when unread · message · date line.

**Two defects in my own build, fixed before commit:**

| Defect | Cause | Fix |
|---|---|---|
| Variants collapsed to 10px tall, then to 174px wide | On a **horizontal** auto-layout frame the *primary* axis is width, not height. `primaryAxisSizingMode='AUTO'` hugged the width and left height pinned at my placeholder | `primaryAxisSizingMode='FIXED'` + `counterAxisSizingMode='AUTO'` |
| Icon tile invisible on unread rows | Tile and unread row were both `accent-soft` | Tile is `surface-primary` with a `border-subtle` stroke, so it reads on both variants |

The first is the same axis confusion that produced the 10px collapse twice. Worth stating
plainly: for `HORIZONTAL` frames, primary = width; for `VERTICAL`, primary = height.

## Responsive

| Width | Height | Clipped | Crunched |
|---|--:|--:|--:|
| 1280 | 691 | 0 | 0 |
| 1024 | 691 | 0 | 0 |
| 834 | 691 | 0 | 0 |
| 680 | 691 | 0 | 0 |

0 off-ramp type sizes. Height is constant because every region is already fluid.

## Library fixes applied from the QA workstream

| Fix | Node | Effect |
|---|---|---|
| `App topbar` `EN` / `ع` / `MA` → `t-eyebrow`, `t-eyebrow-ar` | `20:182`, `20:184`, `20:196` | **140 unstyled nodes retired** — the largest single gap in the file |
| `SyncIndicator` glyphs 11px → `t-caption` | `174:74…174:94` | 6 nodes, inert at 11.5 |
| `ComplianceScore` 16px → `t-section` | `174:46`, `174:56`, `174:66` | 3 nodes |
| `FileUpload` name collision | `318:138` → **`EvidenceAttachment`** | two published components no longer share one name |
| 7 scaffold stubs → `DEPRECATED — …` with pointers | `15:9`, `15:11`, `15:12`, `15:44`, `15:45`, `9:43`, `9:45` | all verified **0 instances**; renamed, **not deleted** |
| `dialog` `15:30`, `menu` `15:33` | description pointers only | 1 live instance each — migrate before retiring |

**Where I overrode the audit:** it called `Panel` `11:45` a dead stub. It has **9 live
instances**. Not touched. Every rename above was preceded by an instance count.

## Deliberately not fixed

- **10px notification count** and `Badge`'s 10px internals. There is **no registered 10px text
  style**. That is one design-system decision spanning two components, not a silent local edit.
- **36 unbound fills** in the three governed sections — another workstream's frames, preserved
  as reference under the ownership ruling.
- **AR transposition** in `312:42490` — same reason.
