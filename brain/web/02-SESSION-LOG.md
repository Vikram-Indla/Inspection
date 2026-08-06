# 02 — Session Log

Index of every completed task on `apps/web`. Newest first. One row per **task**,
not per session — if a session completes three tasks, three rows appear here.
The detail lives in the record each row links to.

Writing the record and indexing it here is mandatory the moment a task reaches
`done` (`rules/WEB-007-session-record-and-commits.md`). This app is transformed
by agents with no memory between sessions. This file is the memory.

| Date | Task | Record | Outcome |
| --- | --- | --- | --- |
| 2026-08-07 | T-004 · App shell | [2026-08-07-T-004-app-shell](sessions/2026-08/2026-08-07-T-004-app-shell.md) | Shell rebuilt server-first: 15 files in `components/app-shell/**`, 4 in `features/shell/**`, icon layer on `lucide-react`, +638 lines of `.sqx-shell*` CSS. `ShellClient.tsx` (46 KB, 29 inline `<svg>`) off every `(app)` route; 8 client islands replace one monolith; `(app)/layout.tsx` 15 → 6 lines. Three files marked retiring, none deletable (T-007/T-008). **No runtime verification — SWC still blocked.** |
| 2026-08-07 | T-002 · SAQEEL design system | [2026-08-07-T-002-design-system](sessions/2026-08/2026-08-07-T-002-design-system.md) | `apps/web/src/app/saqeel.css` created: 2,050 lines, one file, three cascade layers, 339 tokens, 59 classes, 3 keyframes. Prefix `--sqx-` / `.sqx-` (`--sq-` is occupied). WEB-002 §6 replaced with the one-stylesheet rule; WEB-001 §9 gained the direction exception. `tokens.css` untouched, visual diff zero. |
| 2026-08-06 | Establish rulebook | [2026-08-06-establish-rulebook](sessions/2026-08/2026-08-06-establish-rulebook.md) | `brain/web/` created: 8 binding rule docs, tracker, ledgers, task-record protocol. No code changed. |
