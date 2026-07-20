# Saqeel V2 — canonical token changes (APPLIED to tokens/tokens.css)
| Token | Was | Now | Why | Contrast evidence |
|---|---|---|---|---|
| --ax-color-primary (dark) | #78AEDA (blue) | **#64C2A1** mineral green | Brand ≠ information; dark theme was generic | vs #101317 = 8.3:1 · vs #191D22 = 7.6:1 · inverse #101317 on it = 8.4:1 |
| --ax-color-primary-hover (dark) | #96BFE1 | #7FD0B3 | pairs with new primary | ≥7:1 vs canvas |
| --ax-color-border-control (NEW) | — (#D6DDE2 everywhere, 1.37:1) | light #7A8894 / dark #5C6670 | WCAG 1.4.11 control boundaries ≥3:1 | 3.5:1 vs #FFF · 3.1:1 vs #191D22 |
| --ax-color-border | unchanged | decorative rules ONLY (documented) | separators not needed for operation stay light | n/a (decorative) |
| --ax-radius-input | 12px | **6px** | capsule fields removed; 6–8px system | — |
| --ax-text-metric (NEW) | — | 500 28/32 | ordinary KPIs; display 32/40 ≤1×/page | — |
| --ax-text-label (NEW) | — | 500 14/20 | labels must not read as headings | ≥4.5:1 (text token) |
| --ax-text-action (NEW) | — | 500 14/20 | buttons/tabs/segmented were 16/24 semibold | ≥4.5:1 |
| --ax-control-height-compact/admin (NEW) | — | 36px / 40px | density ladder: 36 compact · 40 web/admin standard · 44 principal · 48/52 field | — |
| --ax-color-surface-field (NEW) | — | text-secondary 6% mix | level-2 borderless tonal field | decorative |
| --ax-offset-sticky-top/bottom (NEW) | — | 72px / 96px | focus never fully obscured (2.4.11) | — |
| Texture policy | prohibited | .ax-texture-chrome @1.5%, chrome only, none in print | approved experiment | decorative |
Info blue: light #175CD3 / dark #78AEDA — unchanged, now exclusively information/links/focus-adjacent, never principal action. Print ladder: --ax-color-print-text #111 / -border #555 (existing) + rule #999 documented in PRINT spec.