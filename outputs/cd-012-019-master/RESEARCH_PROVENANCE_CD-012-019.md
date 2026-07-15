# RESEARCH PROVENANCE — CD-012 → CD-019

Three primary source classes per A9.5; per-source: observed principle → adopted → explicitly rejected.
No screenshots or brand grammar copied. Cited from established public design/standards knowledge;
no live fetch this session — runtime facts remain gated by HANDOFF_BLOCKED_REPOSITORY_DISCOVERY.

## 1 · Inspection / enterprise operational patterns
- **Camunda model governance (012/013):** versioned deployable definitions; model/test/deploy split.
  Adopted: version-object library, honest designer separation, replay-as-preview. Rejected: BPMN
  canvas as the summary; free-form diagramming; direct status edits.
- **SAP Fiori list report / object page (012/014/017/018):** scannable object list + drill-in
  detail; analytical object pages where every number traces to a record. Adopted: command bar +
  KPI-traceable rows + expand-in-place. Rejected: card walls, configurable CRUD grids, KPI heroes.
- **Esri Field Maps preparation/offline diagnostics (015):** map readiness and provenance travel
  with the layer. Adopted: confidence stack, thresholds-with-geometry, tiles-as-enhancement.
  Rejected: ArcGIS desktop clone; unlabeled choropleth.
- **Enterprise SIEM/audit narrative timelines (019):** correlation-first investigation. Adopted:
  one audit identity across stream/timeline/diff. Rejected: developer log console aesthetic.

## 2 · Saudi government / public-service
- **DGA (Digital Government Authority) design & content principles:** Arabic-first, bilingual
  parity, plain unambiguous status and next actions, accessibility as baseline. Adopted: AR as
  first-class composition (real long strings, mixed-direction codes), plain guard-callout language
  naming the exact blocker, status = glyph + text. Rejected: English-primary mirroring; colour-only
  status; decorative dashboards over actionable records.

## 3 · Accessibility / RTL standards
- **W3C WCAG 2.2 + WAI internationalization (bidi/logical properties):** meaning not by colour
  alone; visible focus and DOM-order detail; LTR runs isolated inside RTL text. Adopted: token
  focus ring, skip links, aria-disabled with stated reasons, logical-property layout from the
  frozen shell, tabular LTR ids/dates inside RTL rows, reduced-motion honored. Rejected: physical
  left/right offsets; motion as polish theatre.
