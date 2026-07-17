-- ============================================================================
-- Migration 20260717220000 — TASK-MVP2-M2-06-SPATIAL-GIS-001
-- MVP2-REQ-0087..0108, 0123, 0127, 0193, 0197..0216 · Design CD-045 R2 (spatial_canvas_v1)
--
-- Additive spatial/GIS foundation. New objects only; the accepted FND-007 official
-- pin ownership (factories.official_lat/lng — GIS-admin only), geo_events,
-- geo_override_requests, engine_settings.gis v1 and the override workflow are all
-- preserved and untouched. Mapbox is a HELD provider (no token invented).
--
-- POLICY BOUNDARY (DEC-002): geofence radii, accuracy thresholds and retention are
-- the accepted engine_settings.gis values — this migration invents none. Layers
-- carry references/config, not new policy numbers.
--
-- Forward-only, additive. Runtime DB_VALIDATION_PENDING (+ Mapbox provider held).
-- ============================================================================

create table if not exists public.gis_layers (
  id uuid primary key default gen_random_uuid(),
  layer_key text not null unique,
  label text not null,
  layer_type text not null check (layer_type in ('base','overlay','boundary','heat','route')),
  source_ref text,
  sensitivity_class text,                 -- drives location_visibility_matrix
  active boolean not null default true,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now()
);

create table if not exists public.factory_locations (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories(id),
  -- proposed/working geometry; the AUTHORITATIVE pin remains factories.official_* (FND-007)
  lat numeric(10,7),
  lng numeric(10,7),
  geofence_radius_m integer,              -- may reference engine_settings.gis default; never invented here
  source text check (source in ('proposed','surveyed','corrected')),
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now()
);
create index if not exists factory_locations_factory_idx on public.factory_locations(factory_id);

create table if not exists public.location_visibility_matrix (
  id uuid primary key default gen_random_uuid(),
  sensitivity_class text not null,
  role_key text not null,
  can_view_precise boolean not null default false,   -- else masked/approximate
  unique (sensitivity_class, role_key)
);

create table if not exists public.map_packs (
  id uuid primary key default gen_random_uuid(),
  pack_key text not null,
  region text,
  status text not null default 'draft' check (status in ('draft','built','published','stale')),
  bounds jsonb,
  built_at timestamptz,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now()
);

create table if not exists public.route_snapshots (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid,
  -- projected route label + geometry reference; matches accepted "projected-route" label rule
  label text,
  geometry_ref text,
  captured_at timestamptz not null default now()
);
create index if not exists route_snapshots_visit_idx on public.route_snapshots(visit_id, captured_at desc);

-- additive geo columns on evidence (custody preserved; nullable, non-breaking)
alter table public.evidence add column if not exists geo_accuracy_m numeric(8,2);
alter table public.evidence add column if not exists geo_source text;

-- ---------- RLS: deny by default; gis_admin writes, authenticated reads --------
do $$
declare t text;
begin
  foreach t in array array[
    'gis_layers','factory_locations','location_visibility_matrix','map_packs','route_snapshots'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select using (auth.uid() is not null)', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format($p$create policy %I_write on public.%I for insert with check (has_any_role(array['gis_admin','security_admin','compliance_admin']))$p$, t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format($p$create policy %I_update on public.%I for update using (has_any_role(array['gis_admin','security_admin','compliance_admin'])) with check (has_any_role(array['gis_admin','security_admin','compliance_admin']))$p$, t, t);
  end loop;
end $$;
