# Saqeel V2 — density specification
| Mode | Root class | Controls | Actions/labels | Inputs | Content |
|---|---|---|---|---|---|
| Compact admin | .ax-density-compact | 36px utility / 40px action | 14/20 | 15–16/22, 6px radius | tables 14/20, metadata 13/18, reading 15–16/22–24 |
| Standard web | (default) | 40px standard / 44px principal | 14/20 | 16/24 | narrative 16/24, section 19/28, title 24/32 |
| Field iPad | .ax-density-field | 48px min / 52px high-frequency (--ax-control-height-field) | 16/24 | 17/26 | recomposed field-native, not scaled web |
| Report | report renderers | n/a | n/a | n/a | narrative 16/24, tables/meta 14/20, metric 28/32, display ≤1× |
Never mix modes on one surface. iPad targets are never reduced for density; desktop never inherits 48–52px controls.