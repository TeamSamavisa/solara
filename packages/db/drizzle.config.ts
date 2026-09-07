import { config as loadEnv } from "dotenv"

import { defineConfig } from "drizzle-kit"

// The connection string lives at the repo root, shared with the web app.
loadEnv({ path: "../../.env", quiet: true })

export default defineConfig({
  dialect: "mysql",
  schema: "./src/schemas/index.ts",
  out: "./migrations",
  dbCredentials: {
    // Only required by `migrate`, `push`, `pull` and `studio`.
    // `generate` works offline from the schema files alone.
    url: process.env.DATABASE_URL ?? "",
  },
  breakpoints: true,
  strict: true,
  verbose: true,
})
