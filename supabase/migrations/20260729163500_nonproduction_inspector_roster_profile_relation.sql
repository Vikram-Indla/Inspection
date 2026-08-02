-- PostgREST needs an explicit profile relation for the Planner-facing roster
-- embed. This is additive and validates the already-provisioned synthetic rows.
alter table public.nonproduction_inspector_roster
  add constraint nonproduction_inspector_roster_profile_fk
  foreign key (user_id) references public.profiles(user_id) on delete restrict;
