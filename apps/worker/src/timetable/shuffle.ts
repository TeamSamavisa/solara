/**
 * Fisher-Yates with an injected stream, so a run stays reproducible.
 *
 * The original service shuffles its class list before the first placement
 * "mostly because of teachers": the greedy first-fit walks the list in order,
 * so classes that arrive grouped by teacher or by class group end up stacked
 * on the same rows and start out in conflict.
 */
export function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))

    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}
