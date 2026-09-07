import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({ dir: "./" })

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
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    // `server-only` throws unless it is resolved through the `react-server`
    // condition, which Jest does not set.
    "^server-only$": "<rootDir>/test/stubs/server-only.ts",
  },
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  // Tests live under `test/`, mirroring the source tree they cover.
  testMatch: ["<rootDir>/test/**/*.test.?([mc])[jt]s?(x)"],
}

export default createJestConfig(config)
