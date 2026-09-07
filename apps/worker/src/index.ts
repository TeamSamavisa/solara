/**
 * Worker entry point.
 *
 * The BullMQ queue and the timetabling algorithm are not wired up yet; this
 * file exists so the package has a runnable entry from the start.
 */
export async function main(): Promise<void> {
  console.log("solara worker: no queue configured yet")
}

// Only run when executed directly, so tests can import this module freely.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  await main()
}
