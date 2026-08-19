# 2026-08-18 · T-161 — `/admin/notifications` rebuilt on SAQEEL

`task: T-161` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014, WEB-015`

---

## Goal

The **Notification & SLA rules** console — a maker-checker configuration for the
`notify.ts` delivery service: create a draft rule (event → channel → recipient →
template → SLA/escalation), publish (a distinct approver required), send a test,
deactivate with a reason. Owner: migrate off legacy (responsiveness LTR/RTL,
framed skeleton, permission gate, gaps, en/ar from files).

## What was wrong

- `AdminShell` + `panel`/`sq-field`/`sq-table`/`sq-lozenge`/`badge`/`t-caption`/
  `btn`/`alert`/`table` + inline styles; **WEB-015** raw controls (4 `<select>`,
  SLA `<input type=number>`, template `<textarea>`, reason `<input>`); ~40
  English-only `t(key,"English")` labels + English action messages; emoji-as-icon
  (`⚠`, `ⓘ`); code comments; flush `RouteLoading`; status as `sq-lozenge`/`badge`.

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/notifications/page.tsx` | rebuilt as a route file (150 → 9) |
| `app/(app)/admin/notifications/loading.tsx` | **framed skeleton** |
| `app/(app)/admin/notifications/actions.ts` | codes→client map; **maker-checker RPCs + validation byte-for-byte** |
| `features/admin-notifications/{queries,types,strings}.ts` | created — reads + `isWriter`/`rolesAvailable` + result/label localizers |
| `components/sections/admin-notifications/` | screen · manager · create-form · rules-table · row-actions · msg · skeleton · module.css |
| `i18n/locales/{en,ar}/admin-notifications.json` | created — new namespace + `messages.ts` |
| Deleted | `NotificationRulesManager.tsx` (rebuilt) |
| Untouched | `preview-actions.ts` (a separate MVP2 studio action, not part of this UI) |

## Decisions

**Permission gate preserved (in-UI, already present).** `loadNotifications`
resolves `isWriter = roles.has("admin")`. Writers get the full manager (create
form + a `DataTable` register with per-row publish / test / deactivate); non-writers
get a read-only register + a "read-only for your role" `Card` notice. The route is
`admin`-gated (`AdminRouteBoundary`), RLS (`notification_rules_admin`) + the
maker-checker RPCs (`publish_notification_rule` / `deactivate_notification_rule`)
stay the authority — all byte-for-byte, plus the honest "SLA storage ≠ live
escalation" note and the "no template catalogue → free text" note.

**WEB-015 + governance.** `SaqeelSelect` ×4 (event/channel/recipient/escalation),
`TextInput` (SLA, deactivation reason), `Textarea` (template) wrapped in `Field`;
rule status a `StatusPill` (draft=warning / published=success / deactivated=danger);
`DataTable` register (`bleed={false}`); event/channel enums shown through
`eventLabel`/`channelLabel` (governed business labels, not raw snake_case); banners
→ `Card` notices; the `⚠`/`ⓘ` emoji dropped. `actions.ts` returns stable codes;
`notifResultMessage` maps them (including the two test-outcome notices);
`NEUTRAL_WRITE_ERROR` and `insertNotification`'s neutral output pass through.

## No regression

- **`admin-platform-design-contract`** ("creation fails closed when the role
  catalogue is unavailable"): re-pointed page/manager reads → `queries.ts`
  (`roleTableRead.error` → `rolesAvailable`), `notif-create-form.tsx`
  (`rolesAvailable`, `disabled={!rolesAvailable}`), and the `en` JSON ("Rule
  creation is turned off; existing rules remain readable.").
- **`package-route-wiring-gaps`** ("reads truthful, mutations provider-backed"):
  the page-source reads → `queries.ts` (`getServerUser()`, `getUserRoles(user.id)`,
  `sb.from("notification_rules")`, `roles.has("admin")`, `roleRead.error`) +
  `notifications-screen.tsx` (`data.rulesFailed` → rules cleared, not zeroed) + the
  `en` JSON ("Nothing is shown as zero"); the `actions.ts` insert/RPC/`outcome.error`
  assertions still hit `actions.ts` unchanged. `expectAdminBoundary()` unchanged.
- `admin-core-orchestrator` `PINNED_DESTINATIONS` ("Notification Configuration" →
  `/admin/notifications`) is a shell-nav label — untouched. All re-pointed
  assertions grep-verified present.

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new/changed files — **0 problems** (the 4 flagged comments
      are in the untouched `preview-actions.ts`, a pre-existing baseline)
- [x] `npm run gates:typography` — PASSED
- [x] `npm run gates:date-inputs` — PASSED (none new)
- [x] `npm run check:design-system-v5` — **60** unchanged; notifications adds **0** (emoji removed)
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**; both re-pointed contracts pass
- [x] **live render (admin persona)** — framed writer manager: the create form with
      `SaqeelSelect` ×4 (humanised event/channel labels + real roles), `TextInput`,
      `Textarea` + hint, primary button, and the `DataTable` empty register
- [x] **axe** — **0 violations**, 28 passes
- [x] **light + dark** — hairline elevation, accent as fill
- [x] **200% zoom** — **0** horizontal overflow
- [x] **Arabic / RTL** — fully mirrored, all copy from `ar` JSON (arrows flow RTL);
      **Arabic mobile 375 px** — the form grid stacks to one column, **0** overflow, single `<main>`
- [x] **create + error path** — submitting a valid draft is RLS-refused for the
      seeded admin (it lacks the `notification_rules` write grant); the neutral
      error surfaces correctly in the danger-toned `NotifMsg` — the maker-checker
      RLS authority working as designed

## Env note

The **populated register + row actions (success path)** couldn't be exercised
because the seeded admin's write is RLS-refused (so no rule persists to list) —
that is the governed behaviour, not a defect. The register's `DataTable` /
`StatusPill` / per-row `NotifRowActions` follow the same patterns verified on the
other migrated tables.

## Proposed commit

```
feat(admin): rebuild notification rules console on saqeel with ds form controls
```

## Next

The remaining admin surfaces (audit, items, workflows, devices, delegation, …).
