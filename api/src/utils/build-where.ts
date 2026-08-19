export function buildWhere<T extends Record<string, any>>(dto: T): Partial<T> {
  const entries = Object.entries(dto).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );

  return Object.fromEntries(entries) as Partial<T>;
}
