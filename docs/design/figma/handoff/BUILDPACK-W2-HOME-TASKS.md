# W2 build pack — Home + Tasks (iPad source page `2284:104021`)

Worker: W2-HomeAndTasks. Scope: iPad source file `8wGaofgbopqmGXc0Wjo0eW`, page
`2284:104021` ("↪ Home + Tasks - الرئيسية + مهامي") — **read only**. No node in that file
was created, edited, moved or deleted. No node in the Web master file
(`ML2PNwfShlQM2k44MvSEw5`) was touched either — this document is a build pack for
**W10-ReconciliationLedger**, who owns all master-file edits.

This scope overlaps prior inventory work (`SOURCE-SCREEN-CLASSIFICATION-2026-08-01.md`,
`INSPECTOR-FRAME-REGISTER-2026-08-01.md`, `INSPECTOR-JOURNEY-CONTRACT-2026-08-01.md`).
Where this pack confirms those findings it says so; where it corrects or adds detail
(mostly: exact per-node dedupe, live-code verification against `apps/web`) it says that
too.

---

## 1. Page inventory

The page is a **single SECTION**, `2284:104023` ("Home Page and Tasks"), 11950×9413,
containing **42 direct children**: 18 frames (screens), 1 section (`Change Password`,
4 more frames inside it — 22 frames total including that nesting), 1 group
(`Group 524`, a small annotation), 1 group (`Group 525`, the page title banner), and
20 vector/text nodes that are journey-map arrows and flow-step labels, not screens.

This matches the prior classification's count exactly: **18 distinct frames, 27 other
nodes** (20 loose vectors/text + `Group 524` + `Group 525`, each counted as one "other"
node plus their own children — the classification doc's "27" is the flattened count).

| Frame node | Layer name | Size | Position | Content (verified by screenshot or child inspection) |
|---|---|---|---|---|
| `2284:104024` | My Tasks | 834×1194 | 5267,5113 | Home map, collapsed "closest tasks" sheet |
| `2284:104027` | My Tasks | 834×1194 | 5267,3000 | **Duplicate** of `104024` — same screen, same state |
| `2284:104030` | My Tasks | 834×1194 | 5267,6494 | Home map, task pin selected → route preview + mini establishment card |
| `2284:104033` | My Tasks | 834×1194 | 5267,7922 | Establishment/task detail — **in-progress** state (Resume Visit) |
| `2284:104036` | My Tasks | 834×1194 | 1794,6460 | Establishment/task detail — **new** state (Start Visit / Start Remote Visit) |
| `2284:104104` | My Tasks | 834×1194 | 1806,8139 | Profile ("الملف الشخصي") |
| `2284:104171` | My Tasks | 834×1194 | 3411,5113 | My Tasks — full list (search, filter, records toggle) |
| `2284:104188` | Modal | 574×388 | 740,6460 | "الجدول الزمني" (Timeline) modal — visit start/total/end time |
| `2284:104206` | My Tasks | 834×1194 | 6575,912 | App splash (logo on dotted background) — mislabeled "My Tasks" |
| `2284:104208` | My Tasks | 834×1194 | 7238,7922 | Notifications list ("الإشعارات") |
| `2284:104220` | My Tasks | 834×1194 | 8638,7922 | Notification detail ("تفاصيل الإشعار") |
| `2284:104232` | My Tasks | 834×1194 | 7238,6494 | Home map, expanded ranked "closest tasks" list (1–5, with distance) |
| `2284:104272` | Home Screen - iPad | 834×1194 | 7883,912 | **iPadOS springboard** — Wallpaper, Status/Menu bar, App Icons (FaceTime, Files, Maps, Settings…), Dock. Not a product screen. |
| `2665:30714` | Login | 834×1194 | 5267,912 | Login (email + password, "forgot password?" link) |
| `2665:34915` | Login | 834×1194 | (in `Change Password` section) | Reset password — step 1: enter email |
| `2665:39117` | Login | 834×1194 | (in `Change Password` section) | Reset password — step 2 (code/OTP entry, per overview thumbnail) |
| `2665:43321` | Login | 834×1194 | (in `Change Password` section) | Reset password — step 3 (set new password, per overview thumbnail) |
| `2665:47522` | Login | 834×1194 | (in `Change Password` section) | Reset password — step 4 (confirmation, per overview thumbnail) |

Non-screen nodes on the canvas: `Group 524` (a small note bubble, "في حال ان الزيارة لا
زالت قيد التنفيذ" — "if the visit is still in progress"), `Group 525` (the green page
title banner reading the journey label), and 20 loose vectors/arrows/labels that
together draw the flow diagram visible in the page overview (login → home →
profile/notifications, and home → task list → task detail). These are annotations, not
frames, and carry no disposition of their own.

Screenshot evidence lives in
`/private/tmp/claude-502/-Users-vikramindla-Developer-Inspection/62ab1d36-850d-44d3-8b0a-712ab4e9a0c1/scratchpad/w2/`
(session-scoped scratch — not committed) for: the full journey overview, both map
states, both task-detail states, the My Tasks list, profile, notifications list +
detail, the timeline modal, login, one reset-password step, and the iPad springboard.

---

## 2. Dedupe map

18 frames → **14 distinct screen concepts** (one exact duplicate removed):

| # | Concept | Canonical node | Duplicate(s) |
|---|---|---|---|
| 1 | Login | `2665:30714` | — |
| 2 | Reset password (4-step flow) | `2665:34915` → `39117` → `43321` → `47522` | — (sequential steps, not duplicates of each other) |
| 3 | App splash | `2284:104206` | — |
| 4 | Home map — collapsed nearby-tasks sheet | `2284:104024` | `2284:104027` (pixel-identical state) |
| 5 | Home map — expanded ranked nearby-tasks list | `2284:104232` | — |
| 6 | Home map — task selected, route preview card | `2284:104030` | — |
| 7 | My Tasks — full list | `2284:104171` | — |
| 8 | Establishment/task detail — new state | `2284:104036` | — |
| 9 | Establishment/task detail — in-progress state | `2284:104033` | — |
| 10 | Timeline modal | `2284:104188` | — |
| 11 | Profile | `2284:104104` | — |
| 12 | Notifications list | `2284:104208` | — |
| 13 | Notification detail | `2284:104220` | — |
| 14 | iPadOS springboard | `2284:104272` | — |

Concept-level rollup matches the prior classification's "My Tasks" (11 frames), "Modal"
(1), "Login" (5), "Home Screen — iPad" (1) = 18. This pack breaks the 11 "My Tasks"-named
frames into their **7 real sub-concepts** (splash was mis-swept into that name bucket
too, making it 8 of the 11) since a name is not a screen, per the same principle the
prior audit already established for the source file as a whole.

---

## 3. Per-screen region / control / state / action spec

### 3.1 Login (`2665:30714`)
- **Regions**: ministry lockup (logo + AR wordmark) top-center; card containing title
  "تسجيل الدخول", two fields, primary button, secondary link.
- **Fields**: البريد الإلكتروني (email, text input), كلمة المرور (password, input with
  visibility-toggle icon).
- **Controls**: primary button "تسجيل دخول" (Log in); text link "نسيت كلمة المرور؟"
  (Forgot password?).
- **States shown**: one (empty/default). No error, loading or disabled state present
  on this frame.
- **Actions**: submit credentials → home map; tap forgot-password link → reset flow
  step 1.

### 3.2 Reset password flow (`2665:34915/39117/43321/47522`)
- Same ministry lockup + card chrome as login.
- **Step 1** (`34915`, screenshotted): title "إعادة تعيين كلمة المرور", helper text, one
  field (البريد الإلكتروني), primary button "متابعة" (Continue), text link "عودة" (Back).
- **Steps 2–4** (`39117/43321/47522`): read from the page overview thumbnail only (not
  individually opened) — step 2 appears to be a code/OTP field, step 3 a new-password
  pair of fields, step 4 a confirmation panel with a single button. Exact field labels
  for these three were **not verified at full resolution** — flag for W10 if
  pixel-exact copy is needed; the flow shape (email → code → new password → confirm)
  is confirmed by node sequence and thumbnail.

### 3.3 App splash (`2284:104206`)
- **Regions**: single centered ministry logo instance on a plain dotted background.
- **Controls/fields**: none — a loading/branding frame, not an interactive screen.

### 3.4 Home map — collapsed sheet (`2284:104024`, dup `2284:104027`)
- **Regions**: full-bleed map (top ~55% of viewport); floating avatar button
  (top-right, opens profile) + notification bell button (badge-capable, opens
  notifications) stacked top-right; compass/recenter control (top-left); bottom sheet
  (drag handle, "عرض جميع المهام" / View all tasks button, "اقرب المهام" / Nearest
  tasks header, 2 visible task rows before the fold); bottom tab bar (Establishments,
  My Tasks — badge "99+", Home — active).
- **Task row fields**: status badge (e.g. "جديد" New, blue dot), task ref `#192994`,
  numbered map-pin badge (1/2/3…), establishment name, created date.
- **Map markers**: numbered pins per nearby establishment, plus the user's live
  location dot.
- **States**: default/collapsed only on this frame; badge count "99+" on the
  notification icon is a saturation state, not a separate frame.
- **Actions**: tap "عرض جميع المهام" → My Tasks full list; tap a task row/pin → task
  detail or route-preview card; tap avatar → profile; tap bell → notifications; drag
  sheet handle → expanded state (`104232`).

### 3.5 Home map — expanded ranked list (`2284:104232`)
- Same map + top-right controls as 3.4, sheet **expanded**: "عرض جميع المهام" button,
  "اقرب المهام" header, then a **ranked** list — each row now carries a distance chip
  (e.g. "8 كم", "10 كم", "12 كم", "14 كم") in addition to status badge, ref number,
  numbered pin badge, establishment name, date. 5 rows visible before scroll.
- **Action**: tap a row → route preview card (3.6).

### 3.6 Home map — task selected / route preview (`2284:104030`)
- **Regions**: map with a **drawn route line** (blue polyline) from user location to
  the selected pin; a distance+time chip on the route ("8 كم 15 دقيقة" — 8 km, 15 min);
  bottom **card** (not full sheet) showing: establishment status chip ("منشأة مرخصة" /
  Licensed establishment), establishment name, ref + date row, a thumbnail photo,
  status row (حالة الطلب / request status — "جديد" New), two buttons: primary
  "تفاصيل المهمة" (Task details) and secondary "الإتجاهات" (Directions) with a
  navigation icon.
- **Governed-value note**: the "8 كم 15 دقيقة" distance/ETA is a **live routing value**,
  not configuration. If this interaction is ever built, the number must come from a
  real routing/distance API — never a hardcoded or invented figure (CLAUDE.md rule 10).
- **Actions**: tap "تفاصيل المهمة" → establishment/task detail (3.7/3.8); tap
  "الإتجاهات" → native/turn-by-turn directions (device capability, not a design
  surface, same reasoning the prior register applied to Evidence Capture).

### 3.7 Establishment/task detail — new state (`2284:104036`)
- **Regions**: top bar with "مهامي" eyebrow + "تفاصيل طلب #192994" title, "الجدول
  الزمني" (Timeline) button top-left, "عودة" (Back) top-right; hero photo (full-width);
  data card: establishment-type badge ("المنشآت للرخصة"), establishment name (large),
  key-value grid — نوع المنشأة (type), رقم السجل (CR number), حالة المنشأة (status,
  "تأسيس" badge), حالة الطلب (request status, "جديد" badge), تاريخ إنشاء الطلب
  (created date), حجم الاستثمار (investment size, SAR); divider; "مؤشرات التقييم"
  (evaluation indicators) section — درجة الخطورة (risk degree, "عالية الخطورة" / High
  risk badge), نسبة الامتثال (compliance rate, "45% ممتثل"); divider; "بيانات الترخيص"
  (licence data) section — حالة الترخيص (licence status, "ساري" / Active badge), نوع
  الترخيص (Production), رقم الرخصة, تاريخ الاصدار, تاريخ الانتهاء, رمز البند الجمركي.
- **Fixed footer**: two buttons — primary "بدء تنفيذ الزيارة" (Start visit execution),
  secondary "بدء زيارة عن بعد" (Start remote visit).
- **State**: this is the pre-visit / not-started state (both start CTAs enabled).
- **Actions**: tap Timeline → modal (3.9); tap either start button → visit
  start/execution flow (out of this page's scope — belongs to the Execution build
  pack).

### 3.8 Establishment/task detail — in-progress state (`2284:104033`)
- Same region layout as 3.7, with two differences: top bar carries an "الإجراءات"
  (Actions) dropdown button (left of Timeline) instead of a bare back-only header, and
  the footer is a **single** primary button "استكمال الزيارة" (Resume visit) instead of
  the two start buttons.
- **State**: this is the visit-already-started / resume state. Together with 3.7, the
  screen has (at minimum) two states — **status is carried by which CTA renders, not by
  colour**, consistent with CLAUDE.md rule 6.

### 3.9 Timeline modal (`2284:104188`)
- **Regions**: modal dialog, close (×) icon top-left, title "الجدول الزمني للطلب رقم
  #192994"; three stacked rows each with an icon, label and value: "وقت بداية الطلب"
  (start time) with a send/departure icon, "الوقت الاجمالي" (total time, "يومين عمل
  (16 ساعة)" — connected to the rows above/below by a dashed vertical line) with a
  clock icon, "وقت انتهاء الطلب" (end time) with a flag icon.
- **Trigger**: the "الجدول الزمني" button on the establishment/task detail top bar
  (3.7/3.8).

### 3.10 Profile (`2284:104104`)
- **Regions**: header "الملف الشخصي" (Profile) + "عودة" (Back); centered large avatar
  photo; name (large); role subtitle ("مفتش ميداني" — Field Inspector); card with a
  2-column key-value grid — رقم الجوال (mobile number), البريد الإلكتروني (email),
  المنطقة (region), المدينة (city); a "البديل" (Delegate/backup) row with a small
  avatar + name; destructive text action "تسجيل الخروج" (Log out, red, with an
  exit icon).
- **States**: one (populated). No empty/error state present on this frame.

### 3.11 Notifications list (`2284:104208`)
- **Regions**: header "الإشعارات" + Back; scrollable list of notification cards, each
  with: unread badge ("جديد", orange dot) or none, sender name, message body (2–3
  lines, truncated), timestamp line ("11:00 صباحاً - 2025/01/04").
- **State observed**: populated, mixed read/unread. No empty state present on this
  frame.

### 3.12 Notification detail (`2284:104220`)
- **Regions**: header "الإشعارات" eyebrow + "تفاصيل الإشعار" title + Back; a single
  card: date/time (right), sender name + avatar (left), divider, full message body
  (multi-paragraph), signature block ("مع خالص التحية والتقدير" + org name).

### 3.13 iPadOS springboard (`2284:104272`)
- Wallpaper, status/menu bar, a grid of stock iPadOS app icons (FaceTime, Files,
  Preview, Maps, Home, Camera, App Store, Books, Games, TV, News, Settings, Clock,
  Weather, Stocks, Find My, Contacts, Translate, and one Arabic-labelled app icon),
  page-control dots, dock. **Not a product screen** — the operating system's own home
  screen, mistakenly captured into this file.

---

## 4. Web master counterparts (verified against `apps/web` source, not just docs)

| Concept | Route(s) checked | Verified in code |
|---|---|---|
| Login | `/login` | Exists (`apps/web/src/app/login/page.tsx`) — DEC-011 single login, canon |
| Reset password | `/reset` | Exists (`apps/web/src/app/reset/page.tsx`) — "نسيت كلمة المرور؟" / forgot-password copy present in `login/page.tsx:59,95` |
| Home map (all 3 states) | `/field` | `FieldHome` component — **different composition**, built from a separate web source (`SAQEEL Field Dashboard.dc.html`), not this iPad page. Ships: metric strip, AI daily brief, route+factory-preview card, schedule, pending attention, quick actions — no Apple-Maps-style pin/route interaction |
| My Tasks full list + detail (both states) | `/field/my-tasks` | `AssignmentTaskBrowser` — master/detail. CTA copy is an **exact string match**: `field.myTasks.startRemote` → "بدء زيارة عن بُعد", `field.myTasks.startVisit` → "بدء تنفيذ الزيارة" (`my-tasks/page.tsx:610,613`). This is `SCR-IPAD-600`, web-master node `305:40150` |
| Timeline | (button on `/field/my-tasks` detail) | Present, but wired as a **full-page `Link`** to `/field/factory-360/[id]`, not a modal (`my-tasks/page.tsx:472-478`, label `field.myTasks.timeline` = "الجدول الزمني" — exact string match) |
| Profile | `/field/account` | Exists (`account/page.tsx`). Renders avatar, name, role, email, region. **Explicitly does not** render mobile number, city, or delegate/backup — the code comment says why: `profiles` table "carries only full_name/email/region/org_scope — there is NO national-id or phone column" (`account/page.tsx:41-42`) |
| Notifications list + detail | `/field/notifications`, `/field/notifications/[id]` | Both exist and are wired (`notifications/page.tsx`, `notifications/[id]/`) |
| App splash | none | Native app-shell concern, not a routed screen |
| iPadOS springboard | none | Not a product concern |

---

## 5. Classification

| # | Concept | Node(s) | Classification | Reason |
|---|---|---|---|---|
| 1 | Login | `2665:30714` | **approved non-delivery** | Web already has one canonical login under DEC-011; source login is reference only, not authoritative (ruling already recorded in `SOURCE-SCREEN-CLASSIFICATION-2026-08-01.md`) |
| 2 | Reset password (4 steps) | `2665:34915/39117/43321/47522` | **migrated** | `/reset` exists and the login page's forgot-password copy matches; flow shape confirmed. Steps 2–4 field-level copy not pixel-verified (see 3.2) — not a blocker, a footnote for W10 |
| 3 | App splash | `2284:104206` | **approved non-delivery** | App-shell loading chrome, not a product screen; no route can or should represent it |
| 4 | Home map — collapsed sheet | `2284:104024` (dup `104027`) | **shared duplicate** — covered by `/field` (`FieldHome`) | Same *concept* (home landing), materially different *composition*. Not a gap: `/field` is built and live. The map/pin/route interaction the source draws does not exist there — recorded as a delta, not invented |
| 5 | Home map — expanded ranked list | `2284:104232` | **shared duplicate** — covered by `/field` | Same reasoning as #4 |
| 6 | Home map — route preview | `2284:104030` | **shared duplicate, with an open delta** — covered by `/field` conceptually | The specific pin-tap → live-route-with-ETA interaction has no counterpart anywhere in `/field*`. Not classified as a gap requiring a new frame, because building it would require a live routing/distance data source that does not exist yet (CLAUDE.md rule 10 forbids inventing the number). Recorded as a **blocked delta**, not a missing screen |
| 7 | My Tasks full list | `2284:104171` | **migrated** | `/field/my-tasks` (`SCR-IPAD-600`, master node `305:40150`) |
| 8 | Establishment/task detail — new state | `2284:104036` | **migrated** | Same route; CTA copy is an exact string match, see §4 |
| 9 | Establishment/task detail — in-progress | `2284:104033` | **migrated** | Same route; resume-CTA present |
| 10 | Timeline modal | `2284:104188` | **shared duplicate, with a delta** | Functionally covered (`field.myTasks.timeline` button exists, exact label match) but implemented as a page navigation to Factory 360, not a modal. This is an implementation choice already made in shipped code — recording it, not proposing to change it |
| 11 | Profile | `2284:104104` | **shared duplicate, with a field-level gap** | `/field/account` covers avatar/name/role/email/region. Missing: mobile number, city, delegate/backup — **and the code says why**: no phone column on `profiles`. This is a schema gap, not a UI gap — cannot be closed by rendering harder. Absent data already renders correctly as omitted rather than fabricated, matching CLAUDE.md rule 10 |
| 12 | Notifications list | `2284:104208` | **migrated** | `/field/notifications` |
| 13 | Notification detail | `2284:104220` | **migrated** | `/field/notifications/[id]` |
| 14 | iPadOS springboard | `2284:104272` | **approved non-delivery** | Confirmed OS chrome (Wallpaper/Status bar/App Icons/Dock instances) — not a product surface, no route should exist for it |

**Nothing on this page is a `gap` requiring a new Web frame.** Every concept is either
approved non-delivery (app/OS chrome), migrated (a shipped route already delivers it,
verified against source code, not just docs), or a shared duplicate carrying a
recorded delta. The two open deltas (#6 route-preview interaction, #11 profile fields)
are both blocked on data that does not exist yet, not on missing design or missing
build effort — inventing either would violate CLAUDE.md rule 10.

---

## 6. Proposed Web frame list

**Zero new frames proposed.** No concept on this page lacks a governed counterpart
route, and CLAUDE.md rule 9 fixes the route list — there is nowhere ungoverned to hang
a new frame even if one were warranted. This section instead lists the two deltas for
W10/PO disposition, since a build pack that manufactures frames to fill this section
would violate rule 10 (no invented governed values) and rule 3 (a missing capability is
a design-system change request, not a page-level fix):

| Delta | What's missing | Blocked on | Jira |
|---|---|---|---|
| D1 — Home map route-preview interaction | Pin-tap → live route line + distance/ETA card, on `/field` or `/field/my-tasks` | A real routing/distance data source. No component change alone can close this | **NONE FOUND** — no INSP epic covers the inspector channel (confirmed again here; matches `INSPECTOR-FRAME-REGISTER-2026-08-01.md` Blocker 2) |
| D2 — Profile field completeness | Mobile number, city, delegate/backup on `/field/account` | `profiles` table has no phone column and no delegate relationship (`account/page.tsx:41-42`) — a schema decision, not a page fix | **NONE FOUND** |

Both deltas are recorded, not built, and neither proposes a route, a rename, or a
deprecation of anything in the iPad source.

---

## 7. Gaps — summary

None at the screen/route level. Two field/interaction-level deltas (D1, D2 above),
both blocked on data the platform does not yet have, both traceable to a specific line
of shipped code rather than a guess.

## 8. Counts

- Frames inventoried: **18** (+ 4 nested inside `Change Password`, all counted above)
- Distinct screen concepts after dedupe: **14**
- Migrated: **7** (reset password, My Tasks list, task detail ×2 states, notifications
  list + detail — 6 route-level + reset password = 7)
- Shared duplicate (clean): 0 counted separately — folded into migrated/delta rows above
- Shared duplicate with recorded delta: **4** (home map ×3 states, timeline modal,
  profile) — see §5 rows 4/5/6/10/11 (5 rows, 4 unique deltas since #4/#5 share one)
- Approved non-delivery: **3** (login, splash, iPadOS springboard)
- Gap requiring a new frame: **0**
- Proposed new Web frames: **0**
- Open deltas for W10/PO: **2** (D1, D2)
