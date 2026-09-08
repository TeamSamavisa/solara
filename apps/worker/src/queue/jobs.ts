import { z } from "zod"

import { timetableInputSchema } from "@/timetable/schema"

export { OPTIMIZE_TIMETABLE_JOB } from "@solara/queue/jobs"

export const optimizeJobSchema = z.object({
  /** Echoed back so the web app can match a result to the task it created. */
  correlationId: z.string().min(1).optional(),
  taskId: z.number().int().positive().optional(),
  data: timetableInputSchema,
  options: z
    .object({
      /** Fixing the seed makes a run reproducible. */
      seed: z.number().int().optional(),
      evolutionRuns: z.number().int().positive().optional(),
      maxStagnation: z.number().int().positive().optional(),
      annealingIterations: z.number().int().nonnegative().optional(),
    })
    .optional(),
})

export type OptimizeJobPayload = z.infer<typeof optimizeJobSchema>
