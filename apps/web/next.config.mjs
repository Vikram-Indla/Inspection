import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // Allows an isolated verification build to run beside a developer's active
  // dev server without either process corrupting the other's build cache.
  // Production keeps the standard `.next` directory unless explicitly set.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Pin the file-tracing root to this app. A lockfile in the user's home dir
  // otherwise makes Next infer the wrong workspace root (multiple lockfiles);
  // this resolves it without touching anything outside the repo.
  output: "standalone",
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // FIX WAVE F4 · M02-042 — visit attachment uploads go through a server
    // action; the default 1 MB cap would reject real documents. 25 MB matches
    // the accepted evidence engine document limit (engine_settings 'evidence').
    serverActions: { bodySizeLimit: "25mb" },
  },
};
