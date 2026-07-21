# FORM_SYSTEM_SPECIFICATION — SAQEEL Inspection forms
- Short forms: single panel, Field-wrapped controls, actions inline-end.
- Long inspection forms (form.html): Steps header (Details→Checklist→Evidence→Review) + sticky section nav (per-section answered counts, critical flags) + one section panel at a time + prev/next footer.
- Checklist: ChecklistQuestion (compliant/violation/N-A seg + note + evidence); violation answers auto-raise FindingCard linkage; conditional questions render inline with an Informational badge; repeatable sections = Accordion instances.
- Evidence collection: FileUpload → EvidenceStack; signatures as signature-kind evidence.
- Validation: inline Field errors (aria-describedby) + top validation summary Alert linking to fields; submission blocked until required items resolve.
- Save model: autosave with "✓ Saved 14:07" status in header; Draft badge until submitted; unsaved-change warning on navigation (Modal).
- Review mode: read-only summaries (inputs readonly on --surface-sunken) + DescriptionList; submission confirmation Modal → Toast.
- Density: forms stay comfortable even in compact apps — never shrink touch targets on field devices.
