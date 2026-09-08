import { loadQueueConfig } from "@/config"

describe("loadQueueConfig", () => {
  it("falls back to a local Redis and the default queue", () => {
    const config = loadQueueConfig({})

    expect(config).toMatchObject({
      queueName: "timetabling",
      concurrency: 1,
      connection: { host: "127.0.0.1", port: 6379 },
    })
  })

  it("reads a full Redis URL", () => {
    const config = loadQueueConfig({
      REDIS_URL: "redis://cache.internal:6380",
    })

    expect(config.connection).toMatchObject({
      host: "cache.internal",
      port: 6380,
    })
  })

  it("carries credentials from the URL", () => {
    const config = loadQueueConfig({
      REDIS_URL: "redis://user:secret@cache.internal:6379",
    })

    expect(config.connection).toMatchObject({
      username: "user",
      password: "secret",
    })
  })

  it("enables TLS for a rediss URL", () => {
    const config = loadQueueConfig({
      REDIS_URL: "rediss://cache.internal:6379",
    })

    expect(config.connection.tls).toEqual({})
  })

  it("defaults the port when the URL omits it", () => {
    const config = loadQueueConfig({ REDIS_URL: "redis://cache.internal" })

    expect(config.connection.port).toBe(6379)
  })

  it("honours an explicit queue name and concurrency", () => {
    const config = loadQueueConfig({
      TIMETABLING_QUEUE: "grade-horaria",
      WORKER_CONCURRENCY: "4",
    })

    expect(config).toMatchObject({
      queueName: "grade-horaria",
      concurrency: 4,
    })
  })

  it("rejects a malformed Redis URL", () => {
    expect(() => loadQueueConfig({ REDIS_URL: "not a url" })).toThrow(
      /REDIS_URL/,
    )
  })

  it("rejects a concurrency that is not a positive integer", () => {
    expect(() => loadQueueConfig({ WORKER_CONCURRENCY: "0" })).toThrow(
      /WORKER_CONCURRENCY/,
    )
    expect(() => loadQueueConfig({ WORKER_CONCURRENCY: "abc" })).toThrow(
      /WORKER_CONCURRENCY/,
    )
  })
})
