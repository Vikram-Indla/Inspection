# Source component audit — reuse classification

Comprehensive audit of the `⚙️ Components` page in `8wGaofgbopqmGXc0Wjo0eW`, ahead of any
build in the web master. **No components were created or changed by this audit.**

The source file is a **reference input, not a delivery target.** Nothing in it is discarded;
everything is classified below and carries a disposition.

## Headline

| | Count |
|---|---|
| Component definitions on the page | **61** (56 sets + 5 standalone) |
| Total variants | **167** |
| Distinct *concepts* after collapsing duplicates | **35** |
| Definitions that are duplicates of another definition | **33** → 7 concepts |
| Definitions taller than 900px — i.e. whole screens, not components | **40 of 61 (66%)** |

**Two thirds of this "component library" is screens.** A `Summons Notice` at 826×3313 is a
page. That is the single most important finding: the source page cannot be migrated as a
component library because most of it is not one.

## Duplicate concentration

| Concept | Definitions | Variants | Heights |
|---|---|---|---|
| Summons Notice | **12** | 23 | 618 → 3,313 |
| Violation Report | **8** | 11 | 1,276 → 3,219 |
| Questions New | **4** | 13 | 1,157 → 1,922 |
| Non-Compliant Products Destruction Report | 3 | 7 | 2,139 → 3,073 |
| Top Bar | 2 | 7 | 256, 1,156 |
| Checking list | 2 | 7 | 480, 5,658 |
| Incident Report | 2 | 2 | 648, 1,438 |

Twelve separate definitions named `Summons Notice` are not twelve components. They are one
screen at twelve stages of a flow, each frozen as its own component.

---

## Classification

### 1 · Reusable foundation — 8 concepts

Atoms with a direct counterpart in the web master, or that should have one.

| Source | Size | Web counterpart | Disposition |
|---|---|---|---|
| `Task Chips` [3] | 328×48 | `filter-chip` | **Already covered.** Verify variant parity only |
| `Progress Status` | 2384×44 | `progress` | Already covered |
| `Mic Button` [2] | 181×136 | none | **Build.** Voice note is a browser capability, not iPad-only |
| `Media Minis` [8] | 288×601 | none | **Build.** Evidence thumbnail strip; `EvidenceStack` is close but not the same |
| `Multi Media Uploader` [3] | 1376×1052 | `inputs/FileUpload` exists in repo, placed on no screen | **Place it.** Component exists, design does not |
| `Location Pin` [5] | 476×463 | `map/MapMarker` | Already covered; source has 5 states, web has 1 → **extend** |
| `Big Map` [3] | 2791×4412 | `map/MapPanel` + the real KSA geometry | Already covered |
| `Tabs` [4] | 826×3001 | `tabs` (in Review & Approval) | Already covered |

### 2 · Reusable domain component — 9 concepts

Inspection-domain components worth rebuilding responsively in the web master.

| Source | Variants | Web/repo counterpart | Disposition |
|---|---|---|---|
| `Questions` + `Questions New` ×4 + `Questions New selection` | 5+13+3 | `inspection/ChecklistQuestion` (repo, unplaced) | **Consolidate 6 definitions → 1 responsive component.** Highest-value item on the page |
| `Answer Bar` / `Answa` / `Answa 2` | 2+3+3 | none | **Consolidate 3 → 1.** Response control |
| `Checking list` ×2 | 7 | none | **Build.** Section checklist |
| `Location Verification` [2] | 2 | none | **Build.** Geofence + arrival evidence |
| `Task Card` / `Task Card2` / `Task Cards` / `Task Cards Test` / `Map Task Card` | 1+7+1+1+3 | `InspectionCard` | **Consolidate 5 → extend `InspectionCard`** |
| `Factory Detail Table Atom` [15] | 15 | `Table cell` | Already covered; **15 source variants vs current cell** → audit variant gap |
| `Factory Details` [8] | 8 | Factory 360 panels | Already covered |
| `Photos` [1] | 1 | `EvidenceStack` | Already covered |
| `Contact Person Info Mobile` | 1 | `DetailRow` | Covered by composition |

### 3 · Screen pattern — 40 definitions, 6 concepts

Not components. These are report **screens** and belong in a screens section with routes,
personas and states — not in a component library.

| Concept | Definitions | Maps to shipped route |
|---|---|---|
| Summons Notice | 12 | `/field/summons-notices` |
| Violation Report | 8 | inside `/field/inspection/[id]/results` |
| Non-Compliant Products Destruction Report | 3 | `/field/destruction-reports` |
| Sample Collection Report | 2 | `/field/sample-collection-reports` |
| Facility Report | 4 | `/field/facility-reports` |
| Incident Report | 2 | `/field/incident-reports` |

**These are five of the 28 ungoverned `/field/*` routes** flagged in the frame register.
The source file has designs for routes the catalogue does not govern. That is the strongest
argument yet that the catalogue is short rows rather than the routes being unjustified.

### 4 · iPad-only chrome — 2 definitions

| Source | Size | Why |
|---|---|---|
| `Top Bar` [6] | 1227×1156 | Landscape tablet bar, fixed to a device width |
| `Top Bar` [1] | 874×256 | Portrait tablet bar |

**Disposition: reference only, not delivered.** The web master's `App topbar` already
collapses responsively — verified at 834 in the inspector sections. Neither source bar is
needed, but both are recorded here rather than discarded.

### 5 · Duplicate — 33 definitions

Every definition beyond the first in the table above. **Disposition: collapse into the
canonical concept, do not migrate individually.**

### 6 · Obsolete — 5 definitions

| Source | Why |
|---|---|
| `Frame 1984078811` [4] | Auto-generated name, 826×4107, no semantic identity |
| `Frame 1984078775` [1] | Same |
| `Frame 1984078776` [1] | Same |
| `Task Cards Test` | Named as a test artefact |
| `Answa` / `Answa 2` | Misspelled duplicates of `Answer Bar` |

**Disposition: not migrated.** Recorded so the decision is auditable.

---

## What this means for the build

**Do not migrate 61 components.** The real work is:

- **8 foundation concepts** — 5 already covered, 3 to build (`Mic Button`, `Media Minis`, place `FileUpload`)
- **9 domain concepts** — 4 consolidations and 2 new builds
- **6 screen patterns** → screens with routes, not components
- **2 iPad chrome** → reference only
- **33 duplicates + 5 obsolete** → not migrated, recorded

That is **7 components to build or consolidate**, not 61 to copy.

## Jira position — unchanged and still a gap

No epic covers the inspector (`INSP-1`…`16`, `237`, `239` are web, admin, external). The six
screen patterns above map to shipped `/field/*` routes with **no governed screen and no
story**. Every contract below will carry `JIRA: NONE FOUND` until the coordinator resolves it.

## Not yet claimed

This audit classifies **every** definition on the Components page — 61 of 61. It does **not**
cover the eight content pages of the source file, which hold 285 frames. Conversion is not
100% and is not claimed as such: component-page classification is complete, screen-level
reconciliation is not.
