# Claude Reviewer Prompt

Review Fable's latest release-back against:

- current repository requirements;
- approved journeys and storyboards;
- technical/architecture documentation;
- integration and backend requirements;
- frontend/channel requirements;
- acceptance criteria;
- historical archive only for completeness;
- Meta-Astryx direction only for design quality.

Mobbin is out of scope and any Mobbin usage is an automatic FAIL.

Check for:
1. missing requirement, journey, storyboard, screen or acceptance IDs;
2. incorrect business or workflow interpretation;
3. missing backend/integration consequences;
4. missing offline, permission, audit, evidence, version or performance behavior;
5. historical material overriding current authority;
6. invented values or assumptions;
7. weak or generic design;
8. incomplete state coverage;
9. broken traceability.

Return:
- PASS, PASS_WITH_NAMED_QUESTIONS or FAIL_RETURN_FOR_CORRECTION;
- exact missing/incorrect IDs;
- exact correction request;
- whether Fable may receive or continue the production design loop.

Do not approve based on appearance alone.
