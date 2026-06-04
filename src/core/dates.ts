/**
 * Converts an RFC3339/ISO datetime into the API's expected format:
 * yyyy-MM-dd'T'HH:mm:ss+0000 (UTC, numeric offset, no milliseconds).
 * JS Date.toISOString() emits milliseconds and 'Z', which the API rejects.
 */
export function toApiDate(input: string): string {
  const ms = Date.parse(input);
  if (Number.isNaN(ms)) {
    throw new Error(`invalid date '${input}' (expected RFC3339, e.g. 2026-06-05T18:00:00Z)`);
  }
  const d = new Date(ms);
  const pad = (n: number): string => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+0000`
  );
}
