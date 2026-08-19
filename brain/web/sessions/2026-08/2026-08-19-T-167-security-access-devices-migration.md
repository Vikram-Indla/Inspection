# 2026-08-19 · T-167 — `/admin/security-access` + `/admin/devices` rebuilt on SAQEEL

`task: T-167` · `status: done` · `duration: ~3h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014, WEB-015`

---

## Goal

The last two MVP3 control-plane consoles, done together: **Security posture and access
review** (role holdings, an access-certification queue with a maker-checker decision,
purpose-bound evidence grants) and **Trusted device and offline administration** (a device
trust register with governed commands, and command evidence). This closes the four-route
control-plane set (integrations T-156, operations T-163, these T-167) and retires the
shared legacy action plumbing.

## What was wrong (both, identical pattern)

- `AdminShell` + `panel`/`badge`/`alert`/`kpi-value`/`t-caption`/raw `<table>`/`sq-grid` +
  inline styles.
- **English-only `t("mvp3.…","English")` fallbacks — no Arabic** (rule 15).
- WEB-015 raw `<select>` (decision / command) + `<textarea>` (reason).
- The shared legacy `Mvp3ActionForm` (`btn`/`sq-banner`, EN-only "Working…") backed by
  `mvp3-actions.ts`.
- Status as `badge`; `new Date().toLocaleString()/toLocaleDateString()`; flush `RouteLoading`.
- **No emoji** in either route.

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/{security-access,devices}/page.tsx` | rebuilt thin |
| `app/(app)/admin/{security-access,devices}/loading.tsx` | framed skeletons |
| `app/(app)/admin/{security-access,devices}/actions.ts` | created — route-local wrappers (same RPCs, codes) |
| `features/admin-{security-access,devices}/{queries,types,strings}.ts` | created |
| `components/sections/admin-{security-access,devices}/` | screen · form · skeleton · module.css |
| `i18n/locales/{en,ar}/admin-{security-access,devices}.json` | created — two new namespaces + `messages.ts` |
| **Deleted** | `components/Mvp3ActionForm.tsx`, `app/(app)/admin/mvp3-actions.ts` (retired) |
| Untouched | both `layout.tsx` (`allowedRoles={["admin"]}`), the MVP3 RPCs/migrations |

## Decisions

**Same shape as operations (T-163).** `ShellPageFrame` + `StatCard` + `DataTable` +
`StatusPill` + `SaqeelSelect`/`Textarea`/`Button`. Grant state (active/revoked/expired) and
review-overdue are derived server-side; trust/command statuses go through `humaniseEnum`.
Subject / grantee / device / assignee IDs stay raw technical identifiers (in `bdi`/mono),
like the audit event keys.

**Route-local governed actions, then retire the shared plumbing.** Each route's `actions.ts`
calls the same RPC (`mvp3_decide_access_review` / `mvp3_issue_device_command`) but returns
**codes** mapped bilingually — the maker-checker ("subject cannot review own access"),
reason ≥ 8, the four governed device commands, and RLS-as-authority all byte-for-byte from
the old `mapMvp3Error`. With these two routes migrated, `Mvp3ActionForm` + `mvp3-actions.ts`
had zero importers (operations already used its own local wrappers) — so both were
**deleted** (WEB-006 §4: retire when zero imports remain). The lint baseline fell by 269.

**The `mvp3-enterprise` key-sweep is now obsolete — rewritten, not lowered.** That test
(`:113`) counted `t("mvp3.…")` keys across the control-plane pages against a floor and
checked each had an Arabic fallback in `lib/i18n.ts`. All four routes are now off that
legacy pattern, so the sweep has nothing to count. Replaced it with an **en/ar parity
check** across the four namespaces (`admin-integrations`/`admin-operations`/
`admin-security-access`/`admin-devices`): matching top-level key structure + real
Arabic-script content — the same "every control-plane surface ships Arabic" guarantee,
transferred to the proper namespaces (and already enforced by en/ar typecheck parity).

## No regression

- **`mvp3-enterprise-contract`** — `:113` rewritten (parity check, passes 9/9); `:93`
  existsSync on the thin pages, unaffected.
- **`field-settings-contract`** (`:105`) read the deleted `mvp3-actions.ts` — re-pointed to
  the new `devices/actions.ts` (`issueDeviceCommand`, `revalidatePath("/admin/devices")`,
  `sb.rpc("mvp3_issue_device_command"`, no `selfEnrollFieldDevice`). Passes. (`:17`, which
  reads an untouched migration SQL, is a pre-existing baseline failure — not from this work.)
- **`mvp3-retrofit-regression`** (live) — the exact headings "Security posture and access
  review" and "Trusted device and offline administration" are kept, plus a visible `main h2`.
- **`shell-navigation`** owns the "Access Review" / "Trusted Devices" nav labels — untouched.

## Verification

- [x] `npm run typecheck` — clean
- [x] `eslint` on all new/changed files — **0 problems**; `npm run lint` (baseline) — PASSED
      (**−269** from deleting the two shared files)
- [x] `npm run gates:typography` — PASSED
- [x] `npm run gates:date-inputs` — PASSED
- [x] `npm run check:design-system-v5` — **55**; both routes add **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**; the rewritten
      `mvp3-enterprise` key-sweep + the re-pointed `field-settings` `:105` pass
- [x] **live render (admin)** — both framed en + ar with the exact retrofit titles;
      security's boundary notice + 3 StatCards (role holdings / open reviews / active grants)
      + certification `DataTable` empty state + grants; devices' rule notice + trust register
      with the "N trusted" pill + command evidence
- [x] **axe** — **0 violations** (security 26 / devices 25 passes)
- [x] **overflow** — 0 on desktop and Arabic mobile 375 px (stat grid stacks single-column)
- [x] **Arabic / RTL** — both `dir=rtl` `lang=ar`, Arabic titles + notices, mirrored

## Env note

The seed has no access reviews / evidence grants / enrolled devices visible to this admin —
a genuine zero. So the certification decision form and the device-command form (and the
populated tables) couldn't be exercised live; both follow the `useActionState` →
`SaqeelSelect`/`Textarea`/`Button` → codes pattern verified on operations (T-163) and the
maker-checker RLS remains the authority.

## Proposed commit

```
feat(admin): rebuild security-access and devices on saqeel, retire mvp3 action plumbing
```

## Next

The remaining admin surfaces (items, templates, violations).
