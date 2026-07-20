# OFFLINE_AND_SYNC
Offline-first is contractual (field iPad PWA). Visual language:
- **SyncIndicator** pill (feedback/SyncIndicator): synced ✓ compliant · pending … · syncing ⟳ info(spin) · offline ⊘ disabled · conflict ! critical · failed ✕ critical. Glyph+colour+label, never colour alone.
- Offline mode: warning Alert "Working offline — stored on device, syncs automatically" + queued-changes pill in the field taskbar (see screens/tablet).
- Conflict: critical Alert → DiffView with onKeep per-field resolution (original vs offline change, actor+time meta).
- Immutable/sealed records: Alert tone="immutable" (dashed sunken + lock).
- Saving states: "✓ Saved 14:07" header status; Draft badge until submit; unsaved-change Modal on nav.
- The 12 mandatory product states (loading/empty/populated/validation/unauthorized/read-only/stale/degraded/offline/syncing/conflict/success) map to: Skeleton · EmptyState · content · validation Alert+field errors · EmptyState(permission) · immutable Alert+readonly inputs · freshness caption · warning Alert · offline set above · SyncIndicator syncing · DiffView · Toast.
