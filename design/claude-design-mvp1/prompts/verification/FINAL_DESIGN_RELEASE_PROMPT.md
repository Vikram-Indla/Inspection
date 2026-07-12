# Final Design Release Prompt

Create the code-ready design release only after the three audits pass and human approvals are recorded.

Package:

1. Approved foundations and component specifications.
2. All journey designs and clickable physical/virtual prototypes.
3. 38-screen state index.
4. 20-storyboard traceability report.
5. Special-component contracts.
6. English/Arabic and dark/light evidence.
7. Component disposition and affected code paths.
8. Data/provider/open-decision dependencies.
9. Acceptance and signoff records.
10. A Fable implementation sequence that preserves dirty user work and changes the smallest coherent slice at a time.

Reject release if evidence paths are broken, provider-pending behavior is unlabelled, any P0/P1 design criterion fails, or any design implies changes to accepted business behavior. Output `READY_FOR_FABLE_HANDOFF` only; final merge/release remains human-controlled.
