---
name: saqeel-design
description: Use this skill to generate well-branded interfaces and assets for Saqeel (صقيل), the Saudi national industrial inspection platform (MIM Astryx design system), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

This is **Saqeel Design System V4.1 (canonical V2)** — read v2/SAQEEL-DESIGN-SYSTEM-V2-OVERVIEW.md first; explorations/premium-pilot/ is archived provenance, not guidance.
Key rules: link `styles.css` (fonts + tokens + layered ax- library); consume `var(--ax-*)` only — never invent hex; brand green = principal action (dark primary is #64C2A1, NOT blue); blue = information/links; control boundaries = `--ax-color-border-control` (≥3:1); 3 surface levels (canvas / tonal field / bounded panel — no generic bordered boxes); density ladder 36/40/44/48/52 via density roots; buttons & labels 14/20; KPIs 28/32 metric; inputs 6px radius; one principal action per zone; solid danger only in confirmation dialogs; loading keeps its label; dates = Gregorian, Asia/Riyadh, bdi-isolated (never toISOString slicing); status = glyph + word, never color alone; sentence case; contract IDs verbatim; no emoji or pictographic placeholders; RTL via logical properties; texture only via .ax-texture-chrome in chrome.
