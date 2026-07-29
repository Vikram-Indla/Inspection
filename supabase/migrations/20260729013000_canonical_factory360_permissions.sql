-- Canonical-role repair: Factory 360 is the governed target-identity surface
-- used before planning. The four approved SAQEEL roles therefore need its
-- read permission; historical grants predated the canonical-role migration.
-- This changes no provider, secret, export, or role-management entitlement.

insert into public.role_permissions (role_key, permission_key)
select r.role_key, p.permission_key
from public.roles r
cross join (values ('view_factory_360'), ('view_risk_details')) p(permission_key)
where r.role_key in ('admin', 'planner', 'supervisor', 'inspector')
on conflict do nothing;

-- Documents remain a controlled evidence surface. Operational personas may
-- read governed metadata and files through existing RLS; Admin stays config
-- only. Planner and Supervisor can open the target dossier, and Inspector can
-- view the factory context for an assigned visit.
insert into public.role_permissions (role_key, permission_key)
select r.role_key, p.permission_key
from public.roles r
cross join (values ('view_factory_documents'), ('download_factory_documents')) p(permission_key)
where r.role_key in ('planner', 'supervisor', 'inspector')
on conflict do nothing;

-- Both Planner and Supervisor can start a governed planning draft from a
-- verified Factory 360 target. Publishing/release remains lifecycle-gated.
insert into public.role_permissions (role_key, permission_key)
select r.role_key, 'create_inspection'
from public.roles r
where r.role_key in ('planner', 'supervisor')
on conflict do nothing;
