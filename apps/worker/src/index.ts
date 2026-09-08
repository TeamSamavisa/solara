import { config as loadEnv } from "dotenv"

import { loadQueueConfig } from "@solara/queue/config"
import { createOptimizationWorker } from "./queue/worker"

// The repo keeps a single `.env` at the workspace root, shared with the web
// app and drizzle-kit.
loadEnv({ path: new URL("../../../.env", import.meta.url), quiet: true })

/**
 * Worker entry point: connects to Redis and starts consuming timetabling
 * jobs. The optimizer is synchronous and CPU-bound, so concurrency should
 * stay low — see WORKER_CONCURRENCY.
 */
export async function main(): Promise<void> {
  const config = loadQueueConfig()
  const worker = createOptimizationWorker(config)

  console.log(
    `solara worker: consuming "${config.queueName}" at ${config.connection.host}:${config.connection.port}`,
  )

  worker.on("failed", (job, error) => {
    console.error(`job ${job?.id ?? "?"} failed:`, error.message)
  })

  worker.on("completed", (job) => {
    console.log(`job ${job.id} completed`)
  })

  const shutdown = async (signal: string) => {
    console.log(`solara worker: received ${signal}, closing`)
    await worker.close()
    process.exit(0)
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"))
  process.on("SIGINT", () => void shutdown("SIGINT"))
}

// Only run when executed directly, so tests can import this module freely.
if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))
) {
  await main()
}