-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- Restore the canonical governed execution-mode configuration after a clean
-- environment reset. These are the repository's approved release-one modes.
insert into public.engine_settings (engine, settings, version_label)
values (
  'execution',
  '{
    "daily_visit_cap": 10,
    "visit_modes": {
      "physical": {"enabled": true},
      "virtual": {"enabled": true},
      "self_assessment": {"enabled": false, "release_gate": "release_2"}
    },
    "one_penalty_per_violation_phase1": true,
    "journey_start_timing": "inside_visit_window"
  }'::jsonb,
  'v1-execution-canonical-2026-07-21'
)
on conflict (engine) do nothing;
