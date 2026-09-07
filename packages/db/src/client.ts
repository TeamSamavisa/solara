import { drizzle, type MySql2Database } from "drizzle-orm/mysql2"
import { createPool, type Pool } from "mysql2"

export type Database = MySql2Database

let pool: Pool | undefined
let instance: Database | undefined

export function getDb(): Database {
  if (!instance) {
    const url = process.env.DATABASE_URL

    if (!url) {
      throw new Error("DATABASE_URL must be set to connect to the database")
    }

    // The `drizzle(url)` shorthand is broken in drizzle-orm 1.0.0-rc.4: it
    // builds the pool with `mysql2/promise`, whose pool exposes no `.config`,
    // and the driver then throws while setting `config.supportBigNumbers`.
    // Building the callback pool here avoids it; the driver promisifies it.
    pool = createPool({ uri: url })
    instance = drizzle({ client: pool })
  }

  return instance
}

/** Closes the pool. Meant for scripts and integration tests. */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.promise().end()
    pool = undefined
    instance = undefined
  }
}

/**
 * Lazy proxy: importing an action never opens a connection on its own, which
 * keeps the modules importable from tests and from the build step.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, property) {
    const target = getDb() as unknown as Record<string | symbol, unknown>
    const value = target[property]

    return typeof value === "function" ? value.bind(target) : value
  },
})
