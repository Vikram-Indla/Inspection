# TYPOGRAPHY_SPEC — SAQEEL Inspection
**Fonts:** IBM Plex Sans (EN), IBM Plex Sans Arabic (AR), IBM Plex Mono (identifiers ONLY: inspection/permit/asset numbers, coordinates, reference codes).
**Loading:** Google Fonts (weights 400/500/600/700 sans + arabic; 400/500 mono) via tokens/fonts.css; self-host for production with font-display: swap.
**Stacks:** LTR: "IBM Plex Sans","IBM Plex Sans Arabic",-apple-system,"Segoe UI",sans-serif. RTL/[lang=ar]: Arabic first. Mono: "IBM Plex Mono",ui-monospace,"SF Mono",monospace.
**Weights:** 400 content · 500 labels/controls/buttons · 600 headings + important values · 700 hero metrics only (one role).
**Scale:** display 28/1.25 · page-title 22/1.3 · section 17/1.35 · heading 14/1.4 · body-lg 15/1.55 · body 14/1.5 · compact 13/1.45 · table 13/1.4 · label 12/1.35/500 · button 13/500 · meta 12 · caption 11.5 · metric 30/1.15/700 · mono 12.5.
**Arabic adjustments (automatic under [dir=rtl]):** body lh 1.5→1.65, body-lg→1.7, compact→1.6, table→1.55, display→1.4, page-title→1.45, section→1.5; letter-spacing forced to 0 (tracked Arabic is broken Arabic); mono/identifiers embed direction:ltr.
**Contexts:** tables = table role + tabular-nums; forms = label role over compact inputs; navigation = 13/500 (group headers 10.5/600 uppercase EN only — no uppercase transform in Arabic); metrics = metric role; IDs = .t-mono/.id-code.
**Numerals:** Latin digits default (operational cross-referencing); always tabular-nums where data aligns.
**Specimens:** guidelines/type-roles.html, type-metric-mono.html, type-arabic.html (realistic mixed AR/EN content, not placeholder phrases).
