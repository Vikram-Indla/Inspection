# Figma baseline B3 — 5 August 2026

The design file has no tagging mechanism, so this document is the baseline.
The Product Owner ruled a written record sufficient.

**File:** `ML2PNwfShlQM2k44MvSEw5` — Inspection Web
**Recorded:** 5 August 2026
**Pairs with:** platform baseline B3

## What this record is for

Two people can look at the same Figma file a week apart and disagree about what
was changed and when. This states what was altered on 5 August, what was
verified by looking at the rendered result, and what remains disputed or
unexamined.

## Changed and verified by rendering the frame afterwards

Every item below was measured before the change and screenshotted after. That
verification step is the point — three of these were **reported fixed once
already and were not**, because the first pass acted on a description without
looking at the result.

**Reported by Sikander Ahmad and fixed on retest:**

- **panel-decision status dots.** The first fix aligned the dot by taking it out
  of the row's layout, so the full-width text painted over it and the dot
  disappeared. Now back in the row's flow — dot, gap, text starting 16px in.
  Fixed at source; covers all five validation rows everywhere the panel is used.
- **library-head.** The first fix split the row but left the title block fixed
  at 264px inside a 712px row, with a subtitle taller than the block containing
  it, so the text overflowed onto the filters. The title block now fills the
  width and grows to fit; the filter toolbar fills the width too.
- **Sidebar collapse toggle.** Position was fixed on the first pass, size was
  not — a 32px control holding a 12px glyph. Now 17px, which is the largest
  size already present in that sidebar. No new size introduced.

**Reported and fixed first time:**

- **Metric card heights, both rows.** Cards sized to their own content, so rows
  came out ragged — 167/188/171 and 141/152. Cards now fill their row.
- **Table cell alignment.** The badge already centred its own text; the fault
  was that every cell top-aligned its content, so a 20px badge and 17px text at
  the same top edge never shared a centre line. Cell contents now centre
  vertically. Fixed on the Table cell component across all six variants, so it
  applies to every table.
- Earlier in the day: card height mismatch on the week board, a clipped selected
  card border in the pending queue, queue filters not inline, tab wrapping with
  unbadged counts, and analytics filters reflowed.

**Text corrections, 25 items, canonical English set.** Refusal screens rewritten
to say what a reader can do; specification sentences rewritten into business
language; nine engineering annotations deleted.

## Open, and deliberately not changed

- **kpi-grid card shadow.** Sikander reports it as not spreading and lacking
  blue. On inspection the cards carry a full three-layer elevation — 2, 14 and
  32 blur with negative spread on the outer two — applied from a **shared effect
  style**, not per card. Changing it would alter every card in the product to
  fix one screen. Awaiting his answer on whether he means the system-wide
  treatment should change, or whether it looks wrong only there.
- **INSP-767**, the stepper: correct node reference received, not yet actioned.

## Withdrawn claims

- **"The design file is about a quarter corrected."** That figure counted frames,
  not faults, and does not survive checking. A sweep of the Planner and Admin
  pages for the engineering vocabulary being removed from the platform found
  **none**. On that measure the design file was cleaner than the running product.
  No completeness percentage is claimed here.

## Not examined

The dark, Arabic and Arabic-dark duplicates of the route frames; the state
frames; overlays; the 1024 set; the external set; the inspector sections; the
build sections. These are unexamined rather than known-good.

## The method that changed

Every fix in the first pass was made from a written description. Three of eight
did not land, and two made the screen worse than before it was touched.

Every fix in the second pass was measured first and rendered afterwards, and
looked at before being called done.

That is the same lesson the platform work reached independently today: defects
called from shape were wrong four times running, and the faults that mattered
were found by looking.
