import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

test("ERR-AUTH-LOGOUT-001 keeps sign-out on the browser origin", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src", "app", "signout", "route.ts"),
    "utf8",
  );

  expect(source).toContain("await sb.auth.signOut()");
  expect(source).toContain("status: 303");
  expect(source).toContain('Location: "/login?reason=signedout"');
  expect(source).not.toContain('new URL("/", request.url)');
});
