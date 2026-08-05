-- CC-GIS-ARRIVAL-RADIUS-20260805 / INSP-757
--
-- No inspection could be carried out. An inspector with a published, ready
-- visit was stopped at check-in: "Arrival radius is not configured. Check-in
-- is blocked until administration provides a governed radius." Root cause:
-- public.engine_settings holds one row per engine, and there was no row
-- where engine = 'gis'. The administration screen queries that row with
-- .single(), and the field readiness check reads arrival_detection_radius_m
-- from it — so the value was undefined and check-in correctly refused
-- rather than inventing one. The refusal was the platform behaving
-- correctly; the value was simply never supplied.
--
-- Governed value: the arrival radius is 100 metres, applied as a single
-- global default across the platform. Supplied by Product Owner (Vikram),
-- 2026-08-05 ("100 metres, global default") — not inferred, defaulted or
-- derived from code. Per-factory override remains possible where a factory
-- record sets its own radius; this establishes the default, not a
-- prohibition. The existing override path for exceeding the radius is
-- unchanged by this migration.
--
-- Both keys are set to 100. The admin GIS screen reads two values:
-- arrival_detection_radius_m (gates check-in) and geofence_default_radius_m
-- (the fallback for a factory with no radius of its own). Setting only the
-- first would leave the factory-default fallback on GisStudio.tsx's
-- hardcoded 150 — a second, undocumented number contradicting the ruling.
-- That hardcoded 150 becomes unreachable once this row exists; removing it
-- is a separate, later tidy-up, not part of this change.
--
-- Upsert merges into any existing settings (settings || excluded.settings)
-- rather than replacing them, so a future gis setting added by someone else
-- is not silently destroyed.

insert into public.engine_settings (engine, version_label, settings)
values (
  'gis',
  'v1-gis-arrival-radius-2026-08-05',
  jsonb_build_object(
    'arrival_detection_radius_m', 100,
    'geofence_default_radius_m', 100
  )
)
on conflict (engine) do update
  set settings = public.engine_settings.settings
                 || excluded.settings,
      version_label = excluded.version_label;
