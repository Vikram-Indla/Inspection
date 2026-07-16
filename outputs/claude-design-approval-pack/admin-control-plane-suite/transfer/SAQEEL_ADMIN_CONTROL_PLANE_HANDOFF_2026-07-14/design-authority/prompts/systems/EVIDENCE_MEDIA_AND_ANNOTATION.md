# System Prompt — Evidence, Media, and Annotation

Inspect Workspace.tsx, FactoryVerification.tsx, ImageAnnotator.tsx, offline.ts, evidence migrations, storage paths, and evidence rules.

Design photo, video, document, scan, note, and remote-evidence entry with source item/finding, capture time, user/device, location where permitted, size/format, hash status, local/sync state, replacement/supersession, archive, deletion reason, and audit. Preserve compression and annotation before enqueue.

Required states: request permission, capture, preview, annotate, compress, queue offline, upload progress, verify, synced, failed/retry, corrupt, too large, unsupported format, replace, archive, delete pending, deleted, and inaccessible. Never claim malware scan, watermark, or chain-of-custody property unless present in runtime data.

Acceptance IDs: SPC-EV-001 through SPC-EV-009.
