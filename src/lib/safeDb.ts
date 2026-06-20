export function safeGet<T>(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  fallback: T
): T {
  if (!obj || obj[key] === undefined || obj[key] === null) {
    return fallback;
  }
  return obj[key] as T;
}
