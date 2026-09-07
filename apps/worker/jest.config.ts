import type { Config } from "jest"

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coveragePathIgnorePatterns: ["/node_modules/", "<rootDir>/test/"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
  },
  // Tests live under `test/`, mirroring the source tree they cover.
  testMatch: ["<rootDir>/test/**/*.test.?([mc])[jt]s?(x)"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "es2022" } }],
  },
}

export default config
