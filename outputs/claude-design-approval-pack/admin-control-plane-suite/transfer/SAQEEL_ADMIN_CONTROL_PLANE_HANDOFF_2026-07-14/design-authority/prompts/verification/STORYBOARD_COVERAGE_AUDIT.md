# Verification Prompt — Storyboard Coverage

Audit the delivered designs against `authority/STORYBOARD_COVERAGE_MAP.csv`, `JOURNEY_SCREEN_MAP.csv`, the 20 archived storyboard images, and the current AC ledger.

For SB01–SB20 report: required journeys, screens, personas, system engines, happy path, alternate/failure paths, designed frames, missing states, and evidence links. Umbrella storyboards do not pass from a single overview frame; they pass only when all linked screens and handoffs are traceable.

Fail the audit if any storyboard is decorative, any handoff is inferred, any provider simulation is unlabelled, or any requirement is represented only by prose when a visible interaction is required. Return a machine-readable pass/fail table and corrections. Do not self-approve.
