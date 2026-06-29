import { join } from "node:path";
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { z } from "zod";
import { configDir, isNotFound } from "./config";

const TokenDataSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  /** ISO timestamp of access-token expiry; absent for legacy/unknown. */
  expiresAt: z.string().optional(),
  /** OAuth app credentials, kept so refresh works without the original .env. */
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
});

export type TokenData = z.infer<typeof TokenDataSchema>;

/** How long before expiry a token counts as stale and should be refreshed. */
export const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

function tokenFile(dir: string): string {
  return join(dir, "token.json");
}

/** Loads stored token data; returns null when not initialized yet. */
export async function loadToken(dir: string = configDir()): Promise<TokenData | null> {
  let raw: string;
  try {
    raw = await readFile(tokenFile(dir), "utf-8");
  } catch (error: unknown) {
    if (isNotFound(error)) return null;
    throw error;
  }
  const parsed = TokenDataSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error(`invalid token file at ${tokenFile(dir)}: ${parsed.error.message}`);
  }
  return parsed.data;
}

/** Persists token data with owner-only permissions (0600). */
export async function saveToken(token: TokenData, dir: string = configDir()): Promise<void> {
  await mkdir(dir, { recursive: true });
  const file = tokenFile(dir);
  await writeFile(file, JSON.stringify(token, null, 2) + "\n", { mode: 0o600 });
  await chmod(file, 0o600); // writeFile mode is ignored if the file pre-exists
}

export async function deleteToken(dir: string = configDir()): Promise<void> {
  await rm(tokenFile(dir), { force: true });
}

/**
 * Whether the access token should be refreshed at `now`: requires a refresh
 * token, client credentials, and a known expiry within the threshold.
 */
export function shouldRefresh(token: Readonly<TokenData>, now: Date): boolean {
  if (!token.refreshToken || !token.clientId || !token.expiresAt) return false;
  const expiresAt = Date.parse(token.expiresAt);
  if (Number.isNaN(expiresAt)) return false;
  return now.getTime() >= expiresAt - REFRESH_THRESHOLD_MS;
}
