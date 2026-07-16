# Codex Review Prompt

Review the proposed Saqeel UX implementation against the accepted journey design and product contract. Do not redesign during review.

Check:

- Route and component compatibility.
- Functional and permission regression.
- State-transition and immutable-version safety.
- Offline/sync/conflict preservation.
- Provider truth labels.
- Token usage and component consistency.
- Desktop/iPad, Arabic/RTL, dark/light, keyboard, focus, touch, reduced motion, and contrast.
- Map, video, media, review, and realtime acceptance rows.
- Evidence completeness and test results.

Report actionable findings with file/line, violated acceptance ID, impact, and smallest safe correction. Approve only when all P0/P1 criteria have evidence.
