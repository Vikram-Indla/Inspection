# EVIDENCE_SYSTEM
Evidence is an OBJECT with provenance, never a bare thumbnail (signature: Evidence Stack).
- Fields: media (photo/video/document/signature/comment), caption, capture time, coordinates (LTR mono), inspector, linked finding/violation/CAP, verification (verified/unverified/rejected), audit provenance line (device, hash).
- Components: signature/EvidenceStack (list/detailed/grid/compact), inspection/EvidenceCard, inputs/FileUpload (capture), feedback/DiffView (evidence disputes).
- Photography shown honest — no tints, square 3px-radius hairline frames.
- Verification flow: unverified → verify/reject per item; progress bar per record; "Verify all remaining" bulk.
- Reference screen: screens/evidence-review*.
