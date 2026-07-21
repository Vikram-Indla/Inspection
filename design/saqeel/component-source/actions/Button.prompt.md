The single action primitive — one primary (emerald fill) per view; secondary is the workhorse; danger only for destructive confirmation.

```jsx
<Button variant="primary" onClick={save}>Submit for review</Button>
<Button variant="secondary" icon={<SearchIcon/>}>Filter</Button>
<Button variant="ghost" iconOnly aria-label="More" icon={<DotsIcon/>} />
```
Variants: primary · secondary · tertiary (soft emerald) · ghost · danger. States: loading (spinner, keeps width), disabled (45% opacity). Never place two primaries side by side.