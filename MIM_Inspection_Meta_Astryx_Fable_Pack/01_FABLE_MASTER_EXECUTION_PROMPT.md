# Fable Master Execution Prompt — MIM Inspection Platform

## Goal

Design the complete MIM Inspection Platform as an end-to-end, clickable, implementation-ready product using **MIM Astryx**, the Meta-inspired enterprise design system defined in `00_DESIGN_SYSTEM_DECISION.md`.

The requirements and all approved user journeys already exist at:

`/Users/vikramindla/Documents/GitHub/Inspection/Requirements`

Read them directly. Do not rewrite the BRD, recreate the requirements, produce another discovery report or expand documentation for its own sake. Your work is design execution.

## Operating method

### 1. Absorb the product

Read the complete Requirements folder and identify:

- personas and permissions;
- Admin, Web, Operations, iPad and Virtual channels;
- end-to-end journeys;
- screen routes;
- states, transitions and guards;
- evidence, audit, versioning and offline behaviours;
- Arabic and RTL implications.

Create only one concise internal coverage map connecting journey → screen → persona → critical states. Use it to prevent omissions; do not turn it into a large business document.

### 2. Use the design system authority

Apply `00_DESIGN_SYSTEM_DECISION.md` exactly.

Do not invent a different design system, mix Material/Atlassian/Carbon visual languages or use generic generated UI. Build the Astryx token page, foundations and reusable components first.

Use Mobbin MCP to research the strongest current patterns for:

- enterprise admin configuration;
- form/package designers;
- workflow builders;
- planning and assignment;
- field-service tablets;
- inspection/checklist execution;
- evidence capture;
- review and version comparison;
- command centres and operational maps.

Record the reference links and the specific interaction principle adopted. Never copy brand assets or reproduce another product screen.

### 3. Establish the design foundation

Create in Fable:

- foundations: colour, typography, spacing, radii, elevation, iconography and motion;
- desktop and iPad grids;
- responsive rules;
- Arabic/RTL rules;
- accessibility rules;
- core components;
- enterprise components;
- component variants and interaction states.

Every component must show default, hover, focus, active, disabled, loading, validation and permission/read-only states where applicable.

### 4. Design six golden screens first

Before expanding the product, create these high-fidelity golden screens:

1. Admin Package & Form Designer
2. Single Visit Planning, Assignment and Publish
3. Inspector Assigned Visits and Startup Pack
4. Inspector Inspection Workspace with Offline, Evidence and Validation
5. Level 2 Review with Return Scope and Version Comparison
6. Operations Center with Map, Alerts, Timeline and Factory 360 drilldown

For every golden screen, provide:

- desktop/tablet layout as applicable;
- loading, empty, populated, validation, unauthorized, degraded and offline states;
- visible status/version/sync context;
- complete interactions and transitions;
- a short annotation of the behaviour that engineering must preserve.

Do not proceed to mass screen generation until these screens are internally consistent with the same Astryx components.

### 5. Build the end-to-end prototype

Wire the complete primary physical-inspection journey:

Admin configures and publishes package → Planner creates and assigns a visit → Inspector prepares, travels, checks in and executes inspection → Inspector captures evidence/findings/actions → Inspector submits immutable version 1 → Reviewer returns exact sections → Inspector corrects and resubmits version 2 → Reviewer compares and approves → Factory 360 and Operations update.

Include:

- successful path;
- mandatory-data blocker;
- assignment conflict;
- outside-geofence path;
- offline capture and sync;
- evidence upload failure/retry;
- duplicate submit protection;
- selective returned-section editing;
- version comparison;
- unauthorized and degraded-service states.

The prototype must behave as a product, not as a slideshow.

### 6. Expand all required screens

After the golden screens are coherent, expand all screens and journeys from the Requirements folder using the same tokens, components and patterns. No screen may introduce a new visual language or one-off component without first adding it to Astryx.

### 7. Deliver for engineering

Final output must include:

- one Astryx foundation/library page;
- reusable components and variants;
- all required high-fidelity screens;
- complete clickable journeys;
- responsive desktop and iPad behaviour;
- Arabic/RTL variants for representative complex screens;
- annotations for workflow guards, permissions, immutable states, audit, evidence and offline behaviour;
- a concise screen-coverage list showing no journey was omitted.

## Quality bar

The result must be suitable for government stakeholders, KPMG-style reviewers, product owners, designers and development leads. It must feel premium, calm, operationally credible and complete.

Reject and redesign any screen that is:

- generic;
- visually inconsistent;
- merely a raw data dump;
- too dense for field use;
- too decorative for operational work;
- missing critical states;
- not wired;
- dependent on unexplained mock behaviour.

Continue iterating until the design system, golden screens, end-to-end journey and total screen coverage are internally consistent. Do not implement application code.
