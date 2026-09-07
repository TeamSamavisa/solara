import "dotenv/config"

import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "mysql",
  schema: "./lib/db/schemas/index.ts",
  out: "./lib/db/migrations",
  dbCredentials: {
    // Only required by `migrate`, `push`, `pull` and `studio`.
    // `generate` works offline from the schema files alone.
    url: process.env.DATABASE_URL ?? "",
  },
  breakpoints: true,
  strict: true,
  verbose: true,
})
