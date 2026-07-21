# Saqeel Premium — Component specification (design handover; NOT implemented)
Conventions for ALL components: IBM Plex Sans Arabic; logical properties (native RTL); focus = --ax-focus-ring + scroll-margin recipe; targets ≥24px min, 40–44px desktop, 48px touch-critical; reduced-motion honored; sentence case; no raw enums (governed EN/AR labels); numerics tabular + bidi-isolated in AR.

## Hybrid application shell
Anatomy: left service rail (collapsible 248→68px) + top command bar (60px) + optional status rail (46px) + content + optional contextual panel (360px). States: full desktop / compact ≤1100px (identity text drops) / mobile drawer ≤900px (rail becomes modal drawer, focus-trapped) / high-zoom (bars shrink to 48px, content reflows 320px) / RTL mirrored. Keyboard: skip-link first; rail is nav landmark; drawer trap+restore. Dark: rail canvas-mix, bar surface. Print: none of the shell prints.

## Top command bar
Anatomy: brand+service context | global search (combobox) | scope (date range, region) | principal action (1 max, primary fill) | notifications | utilities | profile. 60px; never wraps — overflow collapses into utility menu at defined breakpoints (deterministic, no multi-row). Texture: approved 1.5% tick motif allowed here. Focus: visible on dark or light; z below toasts.

## Left service rail
As current ax-shell nav; changes: selected item = primary-tint + 2px inset start rule (not full green fill); disabled items keep lock + reason, removed from tab order unless explanation essential (then aria-disabled + describedby).

## Page header
Breadcrumb (RTL-aware separators) + title 24/32 + status chips + reference (mono, bidi-isolated) + actions (1 primary max). Sticky optional; if sticky, height ≤64px and scroll-margin applied page-wide.

## Status rail
46px strip; five never-conflated domains as glyph+word pairs (▣ plan ● ops ◆ review ▲ virtual ⟳ sync) + risk + version. role=navigation labeled "Record status". Wraps to 2-row ledger ≤900px, numbered. Not pills; text on surface with domain glyphs. Dark: same tokens.

## Executive report summary
Layer-01 block: title (display, once) + chip row (≤4) + KV grid 4→2→1 + outcome sentence (16/24, bold lead). No box; rules only. Print: becomes A4 page-1 band under ministry header.

## Compliance summary
Counts (metric 28/32) + stacked bar (role=img + text equivalent; NO artificial min-width for zero values — zero renders as 0 with legend note) + legend. Grayscale-safe: print adds per-segment labels.

## Checklist findings
Chapter = numbered rule header (editorial) or chapter row w/ distribution bar (command). Items: 5-col table ≥900px; record rows <900px (item, response chip, note, links). Compliant chapters collapsed on screen via real disclosures (aria-expanded, state persisted); print always complete. Row states: default / issue (critical-tint bg + chip, never color-only) / unanswered (warning chip).

## Violation row
Code (bold) + title + linked items + mapping version (mono) | severity (10px square swatch + word) | legal basis · penalty ref · notice status | corrective action + owner | due (exact Riyadh date + relative urgency chip) | state. Overdue = chip only, row not fully red.

## Corrective-action row
Owner name+role, due exact+relative, progress state chip (complete=success, open=neutral, overdue=critical). Sortable by due; sort = button in th managing aria-sort.

## Evidence preview
Thumb (4:3, tonal field bg) + type glyph + item link + captured timestamp (Riyadh) + custody chip (verified/unsynced/quarantined). Hash + storage path behind native details disclosure with copy action (overflow-wrap:anywhere). Grid auto-fill 132px; print = table with full path+sha256.

## Version & decision timeline
Single chronological list, newest first; entries: decision/submission verb + actor + role + version chip (⎘ mono) + timestamp + reason + returned sections. 2px start rule; key events primary dot. Append-only: no edit affordances ever. role=list; each item self-describing.

## Signature block
Two columns (representative / inspector): name+role, signature preview or rule line, state chip (Signed/Unsigned), timestamp. Print: keep-together atomic block (break-inside:avoid on the block ONLY), min 40mm from page bottom or pushed to next page.

## Tabs / route navigation
Route navigation = links styled as quiet underline segmented control, NO tab roles. True in-page tabs = full WAI-ARIA pattern (ids, aria-controls, roving tabindex, arrow keys). Selected: 2px underline primary + text color, not filled pill.

## Date & time display
Service: Intl.DateTimeFormat, timeZone Asia/Riyadh, Gregorian primary (Hijri = future org-controlled secondary, rendered as suffix "(1448/01/06 هـ)" ONLY when policy enabled). Patterns: date "18 Jul 2026"; date-time "18 Jul 2026, 11:40 (Riyadh)"; due "06 Jul 2026 · 14 days overdue"; range "From 17 Jul 2026, 08:00 to 16:00" (labeled, no bare arrow); refreshed vs generated vs submitted vs decided vs captured vs signed — each labeled. AR: bidi-isolated (<bdi>), Arabic labels, same structure.

## Table
Caption (visible or sr-only); th scope; sort buttons; sticky header on screen; thead repeats in print; density variants compact/standard/narrative; long content wraps (overflow-wrap:anywhere for technical strings); selection checkbox labels include row identity; row states via tint+chip. <900px: priority columns or record rows; horizontal overflow only for truly 2-D data, keyboard-scrollable (tabindex=0 + label).

## Pagination
Buttons with localized accessible names (Previous/Next page, Page N); aria-current=page; 40px targets; RTL flips chevrons via logical order.

## Search combobox
role=combobox + listbox, aria-activedescendant, grouped results with headings (Navigation / Records), loading+empty+error announced via live region; Esc clears; min 38px height, border-control token.

## Modal
Mandatory: aria-labelledby title, close button, initial focus, focus trap, Esc, focus restore. Governed decision confirm restates version+scope+reason; danger = danger button + mandatory reason field. Overlay shadow allowed.

## Drawer
Labeled dialog (aria-labelledby), declared modal (trap) or non-modal (documented); 360px / 92vw; close restores invoker focus.

## Sticky decision bar
Bottom-sticky; 1px border-control outline + soft up-shadow (overlay class); contains decision label + version + actions (1 primary); unsaved state text + live region; page reserves scroll-padding-bottom = bar height + 16; ≤768px full-width bottom sheet, 48px targets.

## Print header & footer
Running header (18mm): ministry lockup + report ref + immutable version. Footer: report ref + "Page n of N" + generated timestamp + contract IDs. Repeated per page; grayscale.