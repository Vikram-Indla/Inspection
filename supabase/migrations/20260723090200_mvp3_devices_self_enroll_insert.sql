create policy mvp3_devices_self_enroll_insert on public.mvp3_devices for insert to authenticated
  with check (
    assigned_user_id = (select auth.uid())
    and enrolled_by = (select auth.uid())
    and trust_status = 'pending'
    and mdm_reference is null
    and app_version_compliant = false
    and last_seen_at is null
    and platform = 'ipad_os'
  );
