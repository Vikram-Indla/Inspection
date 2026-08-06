#!/usr/bin/env node
// next.config.mjs sets output:"standalone". Next.js deliberately does not copy
// public/ or .next/static into .next/standalone/ itself — Dockerfile does that
// at image-build time (COPY public ./public, COPY .next/static ./.next/static)
// before `node server.js`. Locally, `npm run start` (`next start`) errors out
// under standalone output, so nothing outside Docker could ever serve a
// production build — including Playwright's webServer, which shells out to
// `npm run start`. Mirror the same two Dockerfile copies here so `node
// .next/standalone/server.js` also works locally and in CI.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const standalone = join(root, ".next", "standalone");
if (!existsSync(standalone)) {
  console.log("[copy-standalone-assets] no .next/standalone (output isn't \"standalone\" or build was skipped) — nothing to do.");
  process.exit(0);
}

mkdirSync(join(standalone, ".next"), { recursive: true });
cpSync(join(root, ".next", "static"), join(standalone, ".next", "static"), { recursive: true });
cpSync(join(root, "public"), join(standalone, "public"), { recursive: true });
console.log("[copy-standalone-assets] copied public/ and .next/static into .next/standalone/.");
