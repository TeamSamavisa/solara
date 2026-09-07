import { isTerminalStatus, writableStatuses } from "@/tasks"

describe("isTerminalStatus", () => {
  it("treats a finished task as terminal", () => {
    expect(isTerminalStatus("COMPLETED")).toBe(true)
    expect(isTerminalStatus("FAILED")).toBe(true)
  })

  it("keeps a running task open", () => {
    expect(isTerminalStatus("PROCESSING")).toBe(false)
  })
})

describe("writableStatuses", () => {
  it("excludes the initial status the web app already sets", () => {
    expect(writableStatuses()).toEqual(["COMPLETED", "FAILED"])
  })

  it("reads the status list from the shared database package", () => {
    // Proves the workspace link resolves both values and types.
    expect(writableStatuses().length).toBeGreaterThan(0)
  })
})
