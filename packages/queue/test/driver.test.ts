import { createRequire } from "node:module"

/**
 * BullMQ declares `ioredis` as an *optional* peer dependency, so nothing fails
 * at install time when it is missing — the queue only blows up at runtime,
 * when it tries to open a connection. Under pnpm's strict isolation that is
 * exactly what happened, so this pins the dependency down.
 */
describe("redis driver", () => {
  it("is resolvable, since bullmq loads it lazily", () => {
    const require = createRequire(import.meta.url)

    expect(() => require.resolve("ioredis")).not.toThrow()
  })

  it("is reachable from bullmq itself, not just from this package", () => {
    const require = createRequire(import.meta.url)
    const bullmq = require.resolve("bullmq")
    const fromBullmq = createRequire(bullmq)

    expect(() => fromBullmq.resolve("ioredis")).not.toThrow()
  })
})
