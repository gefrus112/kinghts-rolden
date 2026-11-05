import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // z-ai-web-dev-sdk reads runtime config (files/env) — keep it external to the
  // Next.js server bundle so it behaves the same as in plain Node/Bun.
  serverExternalPackages: ["z-ai-web-dev-sdk"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
