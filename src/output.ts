export type OutputFormat = "simple" | "json";

export function parseOutputFormat(value: string): OutputFormat {
  if (value === "simple" || value === "json") return value;
  throw new Error(`invalid output format '${value}' (expected simple|json)`);
}

/** Machine-friendly JSON output; arrays stay arrays (empty list prints []). */
export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/** Minimal left-aligned column table for human output. */
export function printTable(headers: readonly string[], rows: readonly (readonly string[])[]): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)),
  );
  const line = (cells: readonly string[]): string =>
    cells.map((c, i) => c.padEnd(widths[i] ?? 0)).join("  ").trimEnd();
  console.log(line(headers));
  for (const row of rows) console.log(line(row));
}
