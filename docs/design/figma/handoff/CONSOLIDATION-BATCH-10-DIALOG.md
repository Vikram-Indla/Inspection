# Batch 10 — Dialog: 24 source modals to five kinds

Completes the classification of every source **form and state**: the 24 `Modal` frames were the
last unclassified group.

## Classification — all 24

| Kind | Source frames | Where | Distinguishing content |
|---|--:|---|---|
| **Signature** | 8 | Visit Reports 4, Safety 4 | fetch signature, include-from-profile vs add, upload + attached file |
| **Detail** | 6 | Est. Mgmt 5, Home 1 | label/value pairs — document, exemption, chemical clearance, machine, request timeline |
| **Confirm** | 4 | Visit Reports 2, Safety 2 | leave confirmation; two action wordings — *save as draft* vs *continue later* |
| **Penalty** | 4 | Visit Reports 2, Safety 2 | item, description, corrective action, penalty, corrective period |
| **Checklist** | 2 | Visit Reports 1, Safety 1 | grouped violation picker with counts `(14/16)`, `(6/6)` |

The eight Signature modals differ only in one line — *include the signature held on the user
profile* versus *add signature*. That is a content difference, not eight components.

## The existing `dialog` did not cover them

`dialog` `15:30` on the Overlay page is a **360px title + body with no actions**. None of the
five kinds fit it: every one has a footer, four have structured body content, two have form
controls. It is not extended here — it stays as the simple confirmation primitive it is.

## Built

| | |
|---|---|
| Node | **`349:252`** on `Domain: Inspection` |
| Variants | `Kind=Confirm \| Detail \| Penalty \| Checklist \| Signature` |
| Dependencies | `Badge` `9:25`, `Button` `8:32`, `Checkbox` `9:71`, `FileUpload` `175:19` |
| Shared shell | header (title + Close) · subject caption · body · footer actions |

**Governed values are not invented.** The `Detail` kind renders `Not configured` for the document
copy, matching the source's own empty state (`لا توجد نسخة مرفوعة لهذه الوثيقة`). Quantities and
the 30-day corrective period are carried from the source, which is the approved design.

## Verification

| Check | Result |
|---|---|
| Crunched text | **0** |
| Clipped | **0** |
| Unbound fills | **0** |
| Off-ramp type sizes | **0** |
| Reflow at 560 / 480 / 360 | **0 crunched** at every width |

**Unstyled text: 6** — five `Button` labels and one `fileupload-label`. All are **internals of
pre-existing components**, not nodes authored here. They are the same library gap already
recorded for `section-title`, and they belong to `Button` and `FileUpload`.

## Source classification now complete

| Group | Items | Status |
|---|--:|---|
| Component-page definitions | 61 | classified |
| Content-page frames | 295 | classified |
| — of which modals/forms | 24 | **classified here, 5 kinds** |

Every source component, screen, form and state now carries a disposition.
