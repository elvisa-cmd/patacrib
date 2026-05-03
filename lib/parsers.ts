/**
 * Safely parses a JSON string field. Returns fallback on null, undefined, or
 * parse failure. Use this for any string column that stores JSON; do NOT use
 * it on Prisma String[] fields — those are already JS arrays.
 */
export function parseJsonField<T>(
  value: string | null | undefined,
  fallback: T,
): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}
