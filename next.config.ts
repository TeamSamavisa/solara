import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // `jose` ships ESM only. Listing it here also makes `next/jest` transform it,
  // which is the only supported way to relax `transformIgnorePatterns`.
  transpilePackages: ["jose"],
}

export default nextConfig
