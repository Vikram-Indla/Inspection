import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = new URL(
  "../../../supabase/migrations/20260804020000_planning_closure_region_alias_reconciliation.sql",
  import.meta.url,
);
const migration = readFileSync(migrationPath, "utf8");

function normalizedDefinition(sql) {
  const match = sql.match(/create or replace function[\s\S]*?\$\$;/i);
  assert.ok(match, "migration must contain one replaceable function definition");
  return match[0].replace(/\s+/g, " ").trim().toLowerCase();
}

test("BAU-6267 uses a unique forward migration after accepted main", () => {
  assert.match(migrationPath.pathname, /20260804020000_/);
  assert.match(migration, /create or replace function public\.planning_closure_factory_in_scope/);
  assert.doesNotMatch(migration, /drop function|alter table|update public\.profiles|update public\.factories/i);
});

test("BAU-6267 migration is definition-idempotent", () => {
  const once = normalizedDefinition(migration);
  const twice = normalizedDefinition(`${migration}\n${migration}`);
  assert.equal(twice, once);
  assert.match(once, /create or replace function/);
});

test("BAU-6267 aliases only the confirmed Eastern names bidirectionally", () => {
  assert.match(migration, /p\.region='Eastern Province' and f\.region='Eastern'/);
  assert.match(migration, /p\.region='Eastern' and f\.region='Eastern Province'/);
  assert.match(migration, /or f\.region=p\.region/);
  assert.doesNotMatch(migration, /lower\(|ilike|similar to|regexp|National Province/);
});

test("BAU-6267 preserves the security and privilege boundary", () => {
  assert.match(migration, /stable\s+security definer\s+set search_path = ''/);
  assert.match(migration, /revoke all on function[\s\S]*from public,anon,authenticated,service_role/);
  assert.match(migration, /grant execute on function[\s\S]*to authenticated/);
  assert.doesNotMatch(migration, /grant execute[\s\S]*to (?:public|anon|service_role)/);
});
