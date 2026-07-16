# System Prompt — Offline, Sync, Conflict, and Recovery

Inspect `apps/web/src/lib/offline.ts`, PWA registration, field startup/workspace, IndexedDB draft/outbox behavior, idempotency, conflict resolution, and offline E2E tests.

Design a persistent non-color-only sync model: synced, offline-ready, offline local changes, queued, syncing, retrying, conflict, failed, and recovered. Show last successful sync, pending operation count, data scope available offline, and safe actions.

Conflict designs must show this-device value, server value, consequence, keep-mine/keep-server permission, audit, and items requiring user resolution. Never use silent last-write-wins. Include app restart, interrupted upload, duplicate replay, package integrity failure, stale server version, and submitted-offline recovery.

Acceptance IDs: SPC-OFF-001 through SPC-OFF-008.
