/**
 * Domain errors raised by the database actions.
 *
 * They mirror the HTTP exceptions thrown by the legacy NestJS services so the
 * calling layer (route handlers, server actions) can map them back to status
 * codes without depending on a web framework here.
 */
export class DatabaseActionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

/** Equivalent of Nest's `NotFoundException` (HTTP 404). */
export class NotFoundError extends DatabaseActionError {}

/** Equivalent of Nest's `ConflictException` (HTTP 409). */
export class ConflictError extends DatabaseActionError {}
