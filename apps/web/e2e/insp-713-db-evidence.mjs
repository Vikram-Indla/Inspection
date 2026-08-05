const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const token = process.env.NEXT_PUBLIC_SUPABASE_MANAGEMENT_KEY || process.env.SUPABASE_ACCESS_TOKEN;
const ids = process.argv.slice(2);
if (ids.length === 0) throw new Error("Pass evidence record IDs.");
const literals = ids.map((id) => `'${id}'`).join(",");
const queries = {
  audit: `select object_type, object_id, action, count(*)::int event_count
    from public.audit_events where object_id in (${literals})
    group by 1,2,3 order by 1,2,3`,
  policies: `select
    count(*) filter (where (coalesce(qual,'') || coalesce(with_check,'')) like '%has_internal_role%')::int canonical_policy_count,
    count(*) filter (where (coalesce(qual,'') || coalesce(with_check,'')) like '%profile_roles%')::int legacy_policy_count
    from pg_policies where schemaname='public'
    and tablename in ('external_requests','self_assessments','correction_evidence','objections')`,
};

for (const [name, query] of Object.entries(queries)) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`${name}: ${response.status} ${JSON.stringify(body)}`);
  console.log(JSON.stringify({ [name]: body }, null, 2));
}
