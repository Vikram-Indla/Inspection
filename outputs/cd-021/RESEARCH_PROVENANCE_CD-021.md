# RESEARCH_PROVENANCE_CD-021

Three primary sources (no screenshots, layouts, branding or proprietary grammar copied).

## 1. IBM Maximo Manage — Work Orders / Assignment & Dispatching (official enterprise field-service source)
Link: https://www.ibm.com/docs/en/masv-and-l/maximo-manage/cd?topic=application-dispatching-work and https://www.ibm.com/docs/en/masv-and-l/maximo-manage/cd?topic=module-work-orders-application
Observed principle: planning (weeks ahead, criteria/queries over the work set) is a distinct activity from dispatching; work lists communicate priority with configurable color + text, and assignment validates qualification/availability rather than auto-deciding.
Adopted: strict separation of targeting (this screen) from configuration/assignment review (P02); priority/risk as labelled context on rows; availability/eligibility validation surfaced as named blockers before publish.
Rejected: Gantt/graphical scheduling metaphors and drag-assignment (out of MVP1 scope; ENG-05 round-robin + manual picks are the governed mechanisms).
Fit for Saqeel: mirrors the P01->P02->P03 pipeline and M01-029 validation semantics already in the runtime.

## 2. Digital Government Authority (Saudi Arabia) — national digital-government standards (official Saudi government source)
Link: https://dga.gov.sa/en (standards & regulatory documents portal; accessibility and platform guidance)
Observed principle: government services must be bilingual Arabic-first, accessible, and truthful about data provenance; Arabic is the primary presentation language with full RTL, not a translation overlay.
Adopted: Arabic-first document-level RTL frame (1e) as a first-class composition with realistic long labels; source-of-record naming (Factory Registry) and freshness beside every figure; neutral, non-technical error language.
Rejected: DGA green visual identity (retired by sponsor DEC-011) and any GovBar-style chrome (removed at CD-001).
Fit for Saqeel: MIM is a Saudi ministry platform; DGA expectations govern its release context.

## 3. W3C Internationalization — RTL/bidi authoring best practices (authoritative a11y + RTL source)
Link: https://www.w3.org/International/quicktips/ and https://www.w3.org/International/techniques/authoring-html
Observed principle: set base direction once at the document root (dir="rtl"); rely on logical order plus explicit isolation (bdi/dir) for mixed-direction runs such as codes and numbers; do not control direction with CSS alone.
Adopted: document-level dir/lang, logical properties everywhere, bdi-isolated CR numbers/codes/timestamps/deltas, markup-based direction in the handoff contract.
Rejected: per-element visual re-ordering and CSS-only direction hacks.
Fit for Saqeel: matches the existing retired-predecessor.css logical-property architecture and the shell contract's Arabic-first rule.
