export function safeJson<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (e) {
    console.error("[API SAFE FALLBACK]", e);
    return fallback;
  }
}

export function safeArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? data : [];
}

export function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function safeBool(v: unknown): boolean {
  return v === true || v === "true";
}

export function safeNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}
