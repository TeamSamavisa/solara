import type { Config } from "jest"

/**
 * This package has no Next.js dependency, so it transpiles TypeScript with
 * SWC directly (the same engine `next/jest` uses in the web app).
 */
const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    // Test scaffolding is not production code.
    "<rootDir>/test/",
  ],
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
    // `server-only` throws unless it is resolved through the `react-server`
    // condition, which Jest does not set.
    "^server-only$": "<rootDir>/test/stubs/server-only.ts",
  },
  // Tests live under `test/`, mirroring the source tree they cover.
  testMatch: ["<rootDir>/test/**/*.test.?([mc])[jt]s?(x)"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "es2022" } }],
  },
}

export default config
