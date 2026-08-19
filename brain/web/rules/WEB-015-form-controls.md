# WEB-015 — Form controls: design components only, every input placeholdered

Binding law for `apps/web`. A diff that renders a raw HTML form control where a
SAQEEL component exists, or an input with no placeholder, is rejected on sight.

---

## 1. No raw HTML form controls

Never write `<input>`, `<select>`, `<textarea>` (or a legacy `sq-input` /
`input` / `sq-textarea` class) in application code. Every form control is a
SAQEEL component:

| Need | Component |
| --- | --- |
| Single-line text, number, email, tel, url, search, password | `TextInput` |
| Multi-line text | `TextArea` |
| Single choice | `SaqeelSelect` |
| **A single date** | **`DatePickerField`** (submits in a native `<form>` via `name`) or **`DatePicker`** (controlled `value`/`onChange`) |
| A date range | `DateRangePicker` |
| Boolean / choice group | `Choice` / `ChoiceGroup` |

The **only** raw `<input>` permitted is `type="hidden"` for carrying an id or a
picker's serialized value into a server action — never a hidden input a user
interacts with.

## 2. Dates are never a native date input

`<input type="date">` is banned, and `TextInput` **cannot** render one —
`"date"` was removed from `TextInputType`, so `<TextInput type="date">` is a
compile error. A form field that submits a date uses `DatePickerField`
(`name` + `defaultValue`, emits a hidden input, holds its own value); a
controlled surface (filters, live state) uses `DatePicker`. This is the same
`name`-emits-hidden-input contract `DateRangePicker` already uses (`nameFrom` /
`nameTo`).

## 3. Every input carries a placeholder

No `TextInput` / `TextArea` / `DatePickerField` ships without a `placeholder`.
The placeholder is a **real example of valid input** (`"Example: PKG-CHEM-001"`,
`"v1"`, `"Select a date"`), never a repeat of the label and never empty. Copy
comes from i18n like every other string (WEB-013).

## 4. A missing component stops the work — it is not a licence for raw HTML

If a form needs a control the design system does not have, **stop and raise it.**
The component is created first, in `components/saqeel/`, and then consumed.
Bridging the gap with a raw HTML field — or wrapping raw HTML around a component
to fake a capability — is the exact failure this rule exists to prevent.
`DatePickerField` was created this way: the DS had a controlled `DatePicker` but
no form-submittable date field, so the field was built before the screens used
it.

## 5. Enforcement

- **Type:** `TextInputType` excludes `date` (§2).
- **Gate:** `npm run gates:date-inputs` is a ratchet — it counts raw
  `type="date"` inputs in `src/` and fails if the count rises. It may only go
  down; migrating a legacy screen off its raw date input lowers the baseline.
  Update with `npm run gates:date-inputs -- --update` when the count drops.
- **Known debt:** legacy/unmigrated screens still carrying raw date inputs
  (e.g. the inspector `Workspace`, `admin/delegation`, `factories/[id]`, and the
  read-only `PackagePreview` that mirrors the still-raw inspector form) are held
  by the baseline and retired as each screen is migrated. A preview must match
  the real screen it projects — do not swap a preview to a design component while
  the projected screen still renders raw HTML.

## 6. Review gate (answer in the session record)

- Every form control in the diff is a SAQEEL component (no raw `<input>` except
  `type="hidden"`)?
- No `<input type="date">` and no `TextInput type="date"` anywhere in the diff?
- Every `TextInput` / `TextArea` / `DatePickerField` has a placeholder, sourced
  from i18n?
- If a control was missing from the DS, was it built in `components/saqeel/`
  first and recorded — not inlined as raw HTML?
