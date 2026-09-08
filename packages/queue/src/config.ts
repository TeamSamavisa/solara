import { z } from "zod"

export interface RedisConnection {
  host: string
  port: number
  username?: string
  password?: string
  tls?: Record<string, never>
}

export interface QueueConfig {
  queueName: string
  concurrency: number
  connection: RedisConnection
}

const envSchema = z.object({
  REDIS_URL: z
    .string()
    .refine((value) => URL.canParse(value), {
      error: "REDIS_URL deve ser uma URL válida (redis:// ou rediss://).",
    })
    .optional(),
  TIMETABLING_QUEUE: z.string().min(1).default("timetabling"),
  WORKER_CONCURRENCY: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? 1 : Number(value)))
    .refine((value) => Number.isInteger(value) && value > 0, {
      error: "WORKER_CONCURRENCY deve ser um inteiro positivo.",
    }),
})

function parseConnection(url: string | undefined): RedisConnection {
  if (!url) return { host: "127.0.0.1", port: 6379 }

  const parsed = new URL(url)
  const connection: RedisConnection = {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
  }

  if (parsed.username) connection.username = decodeURIComponent(parsed.username)
  if (parsed.password) connection.password = decodeURIComponent(parsed.password)
  // BullMQ enables TLS when the option is present, even if empty.
  if (parsed.protocol === "rediss:") connection.tls = {}

  return connection
}

export function loadQueueConfig(
  env: Record<string, string | undefined> = process.env,
): QueueConfig {
  const parsed = envSchema.safeParse(env)

  if (!parsed.success) {
    throw new Error(
      `Configuração da fila inválida: ${z.prettifyError(parsed.error)}`,
    )
  }

  return {
    queueName: parsed.data.TIMETABLING_QUEUE,
    concurrency: parsed.data.WORKER_CONCURRENCY,
    connection: parseConnection(parsed.data.REDIS_URL),
  }
}
