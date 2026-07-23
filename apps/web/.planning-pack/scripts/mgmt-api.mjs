// Supabase Management API helper — probe + apply migrations for the shared project.
// Reads tokens from apps/web/.env.local WITHOUT printing secret values.
// Usage:
//   node mgmt-api.mjs probe            -> read-only checks (auth, DEC-029 trigger def, applied migrations)
//   node mgmt-api.mjs apply            -> apply pending execution migrations in timestamp order + DEC-029 repair
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..', '..');
const repoRoot = join(webRoot, '..', '..');
const PROJECT_REF = 'iiozvqntawxfwbgffzqu';

function loadEnv() {
  const env = {};
  for (const line of readFileSync(join(webRoot, '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const TOKEN = env.SUPABASE_ACCESS_TOKEN || env.NEXT_PUBLIC_SUPABASE_MANAGEMENT_KEY;
if (!TOKEN) { console.error('NO_TOKEN'); process.exit(2); }

async function api(path, opts = {}) {
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

async function query(sql) {
  return api(`/projects/${PROJECT_REF}/database/query`, { method: 'POST', body: JSON.stringify({ query: sql }) });
}

const mode = process.argv[2] || 'probe';

if (mode === 'probe') {
  const who = await api('/projects');
  console.log('auth_status:', who.status);
  if (who.status !== 200) { console.log('auth_body:', JSON.stringify(who.body).slice(0, 300)); process.exit(1); }

  // Applied migrations table
  const mig = await query(`select version, name from supabase_migrations.schema_migrations order by version desc limit 15`);
  console.log('recent_migrations:', mig.status, JSON.stringify(mig.body).slice(0, 2000));

  // Which of our 9 execution migrations are applied?
  const exec = await query(`select version from supabase_migrations.schema_migrations where version like '20260721%' or version like '20260722%' order by version`);
  console.log('execution_migrations_applied:', exec.status, JSON.stringify(exec.body));

  // DEC-029: find triggers on submission_versions and their function defs
  const trig = await query(`
    select t.tgname, p.proname, pg_get_functiondef(p.oid) as def
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc p on p.oid = t.tgfoid
    where n.nspname = 'public' and c.relname = 'submission_versions' and not t.tgisinternal`);
  console.log('submission_versions_triggers:', trig.status, JSON.stringify(trig.body).slice(0, 4000));

  // probe key RPCs existence
  const rpc = await query(`
    select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and proname in ('has_capability','inspector_daily_capacity','execution_preparation_status') order by 1`);
  console.log('rpc_presence:', rpc.status, JSON.stringify(rpc.body));
  process.exit(0);
}

if (mode === 'apply') {
  const migDir = join(repoRoot, 'supabase', 'migrations');
  const targets = readdirSync(migDir)
    .filter(f => f.endsWith('.sql') &&
      ((f.includes('execution_') && f >= '20260721093000') || f.includes('fix_submission_snapshot')))
    .sort();
  console.log('targets:', JSON.stringify(targets));
  for (const f of targets) {
    const sql = readFileSync(join(migDir, f), 'utf8');
    const r = await query(sql);
    const ok = r.status === 200 || r.status === 201;
    console.log(`APPLY ${f}: status=${r.status}${ok ? '' : ' body=' + JSON.stringify(r.body).slice(0, 800)}`);
    if (!ok) { console.error('STOP_ON_ERROR'); process.exit(1); }
    const version = f.slice(0, 14);
    const name = f.slice(15, -4);
    const rec = await query(`insert into supabase_migrations.schema_migrations(version, name) values ('${version}', '${name}') on conflict (version) do nothing`);
    console.log(`RECORD ${version}: status=${rec.status}${rec.status < 300 ? '' : ' body=' + JSON.stringify(rec.body).slice(0, 400)}`);
  }
  console.log('APPLY_DONE');
  process.exit(0);
}

console.error('unknown mode'); process.exit(2);
