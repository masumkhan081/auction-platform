/**
 * Returns a copy of `obj` with `undefined`-valued keys removed.
 *
 * Why: with `exactOptionalPropertyTypes: true`, an object literal `{ x: undefined }`
 * is NOT assignable to `{ x?: string }`. Zod `.partial()` produces undefined
 * keys for absent fields. This helper bridges the two without weakening types.
 *
 * `null` values are preserved — the caller may genuinely want to clear a column.
 */
export function compact<T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  const out: { [K in keyof T]?: Exclude<T[K], undefined> } = {};
  for (const key of Object.keys(obj) as Array<keyof T>) {
    const value = obj[key];
    if (value !== undefined) {
      (out as Record<string, unknown>)[key as string] = value;
    }
  }
  return out;
}
