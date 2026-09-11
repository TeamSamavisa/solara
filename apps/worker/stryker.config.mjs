/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: "pnpm",
  // pnpm's non-flat node_modules defeats Stryker's plugin auto-discovery.
  plugins: ["@stryker-mutator/jest-runner"],
  testRunner: "jest",
  // Jest's test discovery silently skips dot-directories on Windows, and the
  // default ".stryker-tmp" sandbox is one — a plain name keeps it visible.
  tempDirName: "stryker-tmp",
  jest: {
    projectType: "custom",
    configFile: "jest.config.ts",
  },
  // The timetable engine is pure logic with no I/O — the ideal mutation
  // testing target. Widen or narrow with `--mutate "src/timetable/costs.ts"`.
  mutate: ["src/timetable/**/*.ts"],
  // "perTest" mis-maps coverage under jest+v8+swc in the sandbox: mutants were
  // reported survived without the covering tests ever running against them
  // (verified by hand). "off" runs the full related suite against every
  // mutant — slower, but trustworthy. The suite is small enough for it.
  coverageAnalysis: "off",
  reporters: ["progress", "clear-text", "html"],
  htmlReporter: { fileName: "reports/mutation/index.html" },
  // No hard break yet: use the first runs to learn the baseline score, then
  // set `break` to keep it from regressing.
  thresholds: { high: 80, low: 60, break: null },
}
