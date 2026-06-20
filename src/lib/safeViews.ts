
export function parseViews(v: unknown) {
  if (v == null) return 0;

  const str = String(v).replace(/,/g, "").trim().toUpperCase();
  const num = parseFloat(str);

  if (str.includes("M")) return num * 1_000_000;
  if (str.includes("K")) return num * 1_000;
  if (str.includes("B")) return num * 1_000_000_000;

  return isNaN(num) ? 0 : num;
}
