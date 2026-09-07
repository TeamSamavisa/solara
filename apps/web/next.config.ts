import { config as loadEnv } from "dotenv"
import type { NextConfig } from "next"

// Next only looks for `.env` next to the app it runs from. This repo keeps a
// single `.env` at the workspace root, shared with drizzle-kit and the worker,
// so it is loaded here before the config is evaluated.
loadEnv({ path: "../../.env", quiet: true })

const nextConfig: NextConfig = {
  // `jose` ships ESM only, and `@solara/db` is published as TypeScript source.
  // Listing them here also makes `next/jest` transform them, which is the only
  // supported way to relax `transformIgnorePatterns`.
  transpilePackages: ["jose", "@solara/db"],
}

export default nextConfig
