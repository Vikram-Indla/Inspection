# Verification Prompt — Code Compatibility

Audit designs against the current Next.js source, routes, components, server actions, Supabase schemas, and `authority/CODE_ROUTE_RECONCILIATION.csv`.

For each of 38 governed screens identify the implemented route, logical mode, reused components, proposed shared components, data required, interaction/state guard, and any incompatible design assumption. Confirm no route, field, role, transition, provider, threshold, or backend behavior was invented.

Fail on: design requiring unavailable data without a labelled dependency; route invention without reconciliation; hidden permission/state guard; unlocked submitted content; fake realtime/video; offline state loss; raw visual values outside tokens; or application edits during design phase. Return exact corrections and affected files.
