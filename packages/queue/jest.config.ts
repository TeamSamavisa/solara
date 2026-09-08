import type { Config } from "jest"

/** No Next.js here, so TypeScript is transpiled with SWC directly. */
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
  testMatch: ["<rootDir>/test/**/*.test.?([mc])[jt]s?(x)"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { target: "es2022" } }],
  },
}

export default config
