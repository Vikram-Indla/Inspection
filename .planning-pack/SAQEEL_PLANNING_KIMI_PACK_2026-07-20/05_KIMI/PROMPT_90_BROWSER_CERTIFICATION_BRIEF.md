# Kimi Planning Browser Certification Brief

Use the canonical plan and `PLANNING_ACCEPTANCE_AND_BROWSER_JOURNEYS.csv` as the test contract. Static “implemented” status is not acceptance. Inspect visible pages, network calls, database/RLS effects, audit/notification records and downstream Inspector/Dashboard behaviour.

## Runtime

- URL: `http://127.0.0.1:3000`
- Confirm server belongs to the Planning worktree and serves the pushed candidate SHA.
- Backend: approved Inspection staging project from repository environment.
- Never reveal environment values in evidence.

## Evidence minimum

For each journey record persona, fixture IDs, URL, steps, expected, actual, network/server evidence, audit/RLS evidence, screenshot path, status and defect. Capture English/Arabic and desktop/narrow frames for every major surface. Redact personal data.

## Closure rule

No journey may be called PASS from source inspection alone when browser/database proof is reachable. `BLOCKED_EXTERNAL` is permitted only for an actually missing provider contract/credential. Product data absence should be solved with governed fixtures, not used to avoid the positive path.
