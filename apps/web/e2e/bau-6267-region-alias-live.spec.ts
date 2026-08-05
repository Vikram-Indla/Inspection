import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { login, must, rest, serviceFixtureRest } from "./live-rest";

function crossRolePassword(): string {
  if (process.env.SAQEEL_CROSS_ROLE_PASSWORD?.trim()) return process.env.SAQEEL_CROSS_ROLE_PASSWORD.trim();
  const envPath = join(resolve(__dirname, ".."), ".env.local");
  if (!existsSync(envPath)) throw new Error("missing SAQEEL_CROSS_ROLE_PASSWORD");
  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find(value => value.startsWith("SAQEEL_CROSS_ROLE_PASSWORD="));
  if (!line?.slice(line.indexOf("=") + 1).trim()) throw new Error("missing SAQEEL_CROSS_ROLE_PASSWORD");
  return line.slice(line.indexOf("=") + 1).trim();
}

test("BAU-6267 governed Eastern Province planner sees Eastern but not Riyadh", async () => {
  const planner = await login("planner2@mim.gov.sa", crossRolePassword());
  const profile = must(await rest(
    "GET",
    `profiles?user_id=eq.${planner.userId}&select=email,region`,
    planner.jwt,
  ), "read governed planner scope") as Array<{ email: string; region: string }>;
  expect(profile).toEqual([{ email: "planner2@mim.gov.sa", region: "Eastern Province" }]);

  const factories = must(await serviceFixtureRest(
    "GET",
    "factories?region=in.(Eastern,Riyadh)&select=id,region&order=region.asc",
  ), "resolve positive and negative factory controls") as Array<{ id: string; region: string }>;
  const eastern = factories.find(factory => factory.region === "Eastern");
  const riyadh = factories.find(factory => factory.region === "Riyadh");
  expect(eastern, "fixture must contain an Eastern positive control").toBeTruthy();
  expect(riyadh, "fixture must contain a Riyadh negative control").toBeTruthy();

  const sameRegion = must(await rest(
    "POST",
    "rpc/planning_closure_factory_in_scope",
    planner.jwt,
    { p_factory_id: eastern!.id },
  ), "evaluate Eastern alias scope");
  const crossRegion = must(await rest(
    "POST",
    "rpc/planning_closure_factory_in_scope",
    planner.jwt,
    { p_factory_id: riyadh!.id },
  ), "evaluate cross-region scope");

  expect(sameRegion, "Eastern Province planner must match Eastern factory").toBe(true);
  expect(crossRegion, "Eastern Province planner must not match Riyadh factory").toBe(false);
});
