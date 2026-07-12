/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  experimental: {
    // FIX WAVE F4 · M02-042 — visit attachment uploads go through a server
    // action; the default 1 MB cap would reject real documents. 25 MB matches
    // the accepted evidence engine document limit (engine_settings 'evidence').
    serverActions: { bodySizeLimit: "25mb" },
  },
};
