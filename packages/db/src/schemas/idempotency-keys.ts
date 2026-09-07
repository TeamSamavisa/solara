import { datetime, mysqlTable, varchar } from "drizzle-orm/mysql-core"

/**
 * Records the idempotency key of a mutation that already ran, so a replayed
 * form submission (double click, retried request, refreshed POST) does not
 * create a second record.
 */
export const idempotencyKeys = mysqlTable("idempotency_keys", {
  key: varchar("key", { length: 128 }).primaryKey(),
  scope: varchar("scope", { length: 64 }).notNull(),
  created_at: datetime("created_at").notNull().defaultNow(),
})

export type IdempotencyKey = typeof idempotencyKeys.$inferSelect
