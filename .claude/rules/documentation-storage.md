# Documentation storage

- Human master documents, office/PDF exports, screenshots, videos, evidence attachments, training packs, and historical archives live under `INSPECTION_DOCS_ROOT`.
- Vikram's approved local root is `/Users/vikramindla/Desktop/Inspection Documentation`; other contributors must request access and set their own root.
- Do not hardcode the workstation path in runtime application code.
- Do not recommit external binary documentation. Keep only lightweight pointers and the minimum live machine-readable contract in Git.
- Browser evidence paths must use `apps/web/e2e/evidence-path.ts`.
