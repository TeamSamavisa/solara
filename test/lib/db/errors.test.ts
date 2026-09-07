import {
  ConflictError,
  DatabaseActionError,
  NotFoundError,
} from "@/lib/db/errors"

describe("database errors", () => {
  it("exposes NotFoundError as an Error with a readable name", () => {
    const error = new NotFoundError("Curso não encontrado.")

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(DatabaseActionError)
    expect(error).toBeInstanceOf(NotFoundError)
    expect(error.name).toBe("NotFoundError")
    expect(error.message).toBe("Curso não encontrado.")
  })

  it("exposes ConflictError as an Error with a readable name", () => {
    const error = new ConflictError("Este e-mail já está em uso.")

    expect(error).toBeInstanceOf(DatabaseActionError)
    expect(error).toBeInstanceOf(ConflictError)
    expect(error.name).toBe("ConflictError")
    expect(error.message).toBe("Este e-mail já está em uso.")
  })

  it("keeps the error types distinguishable from each other", () => {
    expect(new ConflictError("x")).not.toBeInstanceOf(NotFoundError)
    expect(new NotFoundError("x")).not.toBeInstanceOf(ConflictError)
  })
})
