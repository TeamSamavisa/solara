export const ROLES = ["teacher", "coordinator", "principal", "admin"] as const

export type Role = (typeof ROLES)[number]

/**
 * Permission hierarchy ported from the legacy `useRole` hook: a higher level
 * satisfies every requirement below it.
 */
const ROLE_LEVEL: Record<Role, number> = {
  admin: 4,
  principal: 3,
  coordinator: 2,
  teacher: 1,
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role)
}

/** True when `role` sits at or above `required` in the hierarchy. */
export function hasRole(role: unknown, required: Role): boolean {
  if (!isRole(role)) return false

  return ROLE_LEVEL[role] >= ROLE_LEVEL[required]
}

/** True when `role` is exactly one of `allowed`. */
export function hasAnyRole(role: unknown, allowed: readonly Role[]): boolean {
  return isRole(role) && allowed.includes(role)
}

export function hasExactRole(role: unknown, expected: Role): boolean {
  return isRole(role) && role === expected
}

/** Human readable role names used across the UI. */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  principal: "Diretor",
  coordinator: "Coordenador",
  teacher: "Professor",
}

export function roleLabel(role: unknown): string {
  return isRole(role) ? ROLE_LABELS[role] : String(role ?? "—")
}
