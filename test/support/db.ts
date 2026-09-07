/**
 * Test helpers for the database actions.
 *
 * Drizzle query builders are chainable thenables, so they are faked with a
 * proxy that records every call in the chain and resolves to a canned result.
 */

export interface ChainStep {
  method: string
  args: unknown[]
}

export interface QueryChain {
  steps: ChainStep[]
  /** Arguments of the first call to `method`, or `undefined` if never called. */
  argsFor(method: string): unknown[] | undefined
  callCount(method: string): number
  methods(): string[]
  [key: string]: unknown
}

/** Properties jest probes on unknown objects; they must not become chain steps. */
const JEST_PROBES = new Set([
  "asymmetricMatch",
  "$$typeof",
  "nodeType",
  "tagName",
  "_isMockFunction",
  "mock",
  "@@__IMMUTABLE_ITERABLE__@@",
  "@@__IMMUTABLE_RECORD__@@",
])

export function createQueryChain<T>(result: T): QueryChain {
  const steps: ChainStep[] = []
  const settled = () => Promise.resolve(result)

  const base = {
    steps,
    argsFor: (method: string) =>
      steps.find((step) => step.method === method)?.args,
    callCount: (method: string) =>
      steps.filter((step) => step.method === method).length,
    methods: () => steps.map((step) => step.method),
    then: (onFulfilled?: never, onRejected?: never) =>
      settled().then(onFulfilled, onRejected),
    catch: (onRejected?: never) => settled().catch(onRejected),
    finally: (onFinally?: never) => settled().finally(onFinally),
  }

  const proxy: QueryChain = new Proxy(base, {
    get(target, property, receiver) {
      if (typeof property === "symbol" || property in target) {
        return Reflect.get(target, property, receiver)
      }

      if (JEST_PROBES.has(property)) return undefined

      return (...args: unknown[]) => {
        steps.push({ method: property, args })
        return proxy
      }
    },
  }) as unknown as QueryChain

  return proxy
}

export interface MockDb {
  select: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  delete: jest.Mock
  transaction: jest.Mock
}

export function createMockDb(): MockDb {
  const db: MockDb = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  }

  // Transactions run against the same mock so queued results keep their order.
  db.transaction.mockImplementation(
    async (callback: (tx: MockDb) => unknown) => callback(db),
  )

  return db
}

/** Queues one chain per result, resolved in call order. */
export function queueResults(mock: jest.Mock, ...results: unknown[]): void {
  for (const result of results) {
    mock.mockReturnValueOnce(createQueryChain(result))
  }
}

/** The chain returned by the n-th (0-based) call of a mocked query root. */
export function chainOf(mock: jest.Mock, index = 0): QueryChain {
  return mock.mock.results[index]?.value as QueryChain
}

/** Clears queued results and reinstalls the transaction passthrough. */
export function resetMockDb(db: MockDb): void {
  db.select.mockReset()
  db.insert.mockReset()
  db.update.mockReset()
  db.delete.mockReset()
  db.transaction.mockReset()
  db.transaction.mockImplementation(
    async (callback: (tx: MockDb) => unknown) => callback(db),
  )
}
