# Golden patterns — what this design system already does well

Recorded so the remediation programme extends these rather than reinventing them. Every item below was read from the live file, not inferred.

## 1. The token foundation (pages *Foundations: ***) — strongest asset in the file

Eight variable collections, correctly separated by concern:

| Collection | Modes | Variables |
|---|---|---|
| Primitives | Value | 23 |
| **Color** | **Light, Dark** | **95** |
| Spacing | Value | 10 |
| Radius | Value | 5 |
| Sizing | Value | 15 |
| Typography | Value | 33 |
| **Shadow** | **Light, Dark** | **20** |
| Motion | Value | 3 |

**Why it works:** colour and shadow carry explicit Light/Dark modes, so theming is a mode switch rather than a parallel set of styles. Spacing, radius and sizing are separated from colour, so a density change cannot accidentally become a colour change.

**Notable:** there are **zero paint styles**. Colour exists only as variables. That is the right call — one source of truth, no drift between a style and a token that mean the same thing.

**Adopt for:** any new surface. There is no justification for a raw colour value anywhere in this file.

## 2. The bilingual type ramp (27 text styles) — adopt everywhere

Every Latin style has a paired Arabic twin, same size, same line height:

| Purpose | Latin | Arabic | Size / line-height |
|---|---|---|---|
| Display | `t-display` | `t-display-ar` | 28 / 125% |
| Page title | `t-page-title` | `t-page-title-ar` | 22 / 130% |
| Section | `t-section` | `t-section-ar` | 17 / 135% |
| Heading | `t-heading` | `t-heading-ar` | 14 / 140% |
| Body large | `t-body-lg` | `t-body-lg-ar` | 15 / 155% |
| Body | `t-body` | `t-body-ar` | 14 / 150% |
| Compact | `t-compact` | `t-compact-ar` | 13 / 145% |
| Label | `t-label` | `t-label-ar` | 12 / 135% |
| Meta | `t-meta` | `t-meta-ar` | 12 / 140% |
| Caption | `t-caption` | `t-caption-ar` | 11.5 / 140% |
| Metric | `t-metric` | `t-metric-ar` | 30 / 115% |
| Eyebrow | `t-eyebrow` | `t-eyebrow-ar` | 12 / 145% |
| Nav group | `t-nav-group` | `t-nav-group-ar` | 12 / 135% |
| Data | `t-mono` | — | 12.5 / auto |

**Why it works:** Arabic is a first-class citizen of the ramp, not a post-hoc substitution. Line heights rise as size falls (115% at 30px → 155% at 15px), which is the correct relationship. `t-mono` exists so identifiers and numeric data are visually distinct from prose.

**Consequences for two open findings:**
- The ramp's smallest size is **11.5px**. Every 9px, 10px and 10.5px node found elsewhere is *outside the declared system*, not merely small — this turns a taste argument into a compliance one.
- The ramp is exactly what the Inter components on *Domain: Inspection* should bind to; their sizes already match it (INSP-783).

## 3. The state vocabulary (page *State*, frame `states` 14:119) — adopt as the canonical state set

Rendered and read end to end. The system already defines, in good product voice:

| State | Copy |
|---|---|
| Error | "Could not load enforcement rules — The last sync failed. Retry or contact platform support if this persists." |
| Conflict | "Local changes conflict with server — Another session edited this record. Resolve the conflict before continuing." |
| Stale | "Data may be out of date — This view has not refreshed in over 15 minutes. Refresh to see the latest." |
| Provider unavailable | "Mapping provider unavailable — Live geolocation is temporarily unavailable. Showing last known positions." |
| Degraded | "Running in degraded mode — Some features are limited while the platform recovers from a partial outage." |
| Not configured | "Not configured — This threshold has not been set by an administrator yet. No value is assumed." |
| Loading | skeleton |
| Empty | "No visits scheduled — Create a planning visit to see it appear here." |
| Unauthorized | "You do not have access to this destination — Ask a security administrator to grant the required role." |

**Why it works:** each is *title states what happened, body states the single next action*. Severity is carried by border colour **and** by the words — never colour alone. "Not configured" explicitly says "No value is assumed", which is exactly the discipline required by the rule against inventing governed values.

**Adopt for:** every screen state. The one variant that breaks the pattern — `saqeel-state--rls-denied` — is the exception being fixed (INSP-784), and its own sibling `saqeel-state--unauthorized` is the model to copy.

**Method note:** the page's top-level children list only four state components. The other six live inside the `states` frame. A node-list inspection alone would have wrongly concluded that state coverage was thin — rendering the page is what showed otherwise.

## 4. The build pages — evidence that clean work is achievable here

| Page | Text nodes | Clipping | Content leaks | Fonts |
|---|---|---|---|---|
| *State & Overlay (build)* | 75 | **0** | **0** | IBM Plex Sans only |
| *Question & Finding (build)* | 973 | **0** | **0** | Plex Sans + Plex Mono |
| *Inspector Form Primitives (build)* | 29 | **0** | **0** | Plex Sans, 27/29 styled |

**Why it matters:** these pages are the counter-example to every defect logged elsewhere. Implementation prose, placeholder text and off-ramp fonts are **not** endemic to the file — they are concentrated in the panel library and the older screen sections. Whoever built the build pages was working to the system.

## 5. The panel library's locale/theme discipline (page *Screen content*)

45 panel components, each existing in four explicit variants: base, `endarkroutes`, `arrtlroutes`, `arrtldarkroutes` — EN/AR × Light/Dark. 180 components total.

**Why it works:** locale and theme are modelled as first-class variants of a named panel rather than as ad-hoc copies, which is why a single copy defect is traceable to exactly four nodes and can be fixed as a set.

**Caveat:** the same structure multiplies content defects by four — one bad sentence became 24 nodes (INSP-755). The structure is right; it just means content must be fixed at the source.

## 6. Deprecation is marked, not hidden (page *Nav & Chrome*)

Two components are explicitly named `DEPRECATED — sidebar (use App sidebar 19:2)` and `DEPRECATED — topbar (use App topbar 20:172)` — the replacement is named in the label, with its node ID.

**Why it works:** a designer reaching for the wrong component is told what to use instead, in place. Adopt this naming convention for any future deprecation rather than deleting components that screens may still reference.
