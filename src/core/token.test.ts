import { describe, expect, test } from "bun:test";
import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  deleteToken,
  loadToken,
  REFRESH_THRESHOLD_MS,
  saveToken,
  shouldRefresh,
  type TokenData,
} from "./token";

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "tock-test-"));
}

describe("token storage", () => {
  test("missing file loads as null", async () => {
    const dir = await tempDir();
    expect(await loadToken(dir)).toBeNull();
  });

  test("save/load round trip", async () => {
    const dir = await tempDir();
    const td: TokenData = {
      accessToken: "at",
      refreshToken: "rt",
      expiresAt: "2026-06-04T12:00:00.000Z",
      clientId: "cid",
      clientSecret: "secret",
    };
    await saveToken(td, dir);
    expect(await loadToken(dir)).toEqual(td);
  });

  test("token file is owner-only (0600)", async () => {
    const dir = await tempDir();
    await saveToken({ accessToken: "at" }, dir);
    const mode = (await stat(join(dir, "token.json"))).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  test("delete removes the file and is idempotent", async () => {
    const dir = await tempDir();
    await saveToken({ accessToken: "at" }, dir);
    await deleteToken(dir);
    expect(await loadToken(dir)).toBeNull();
    await deleteToken(dir); // second delete must not throw
  });
});

describe("shouldRefresh", () => {
  const now = new Date("2026-06-04T12:00:00Z");
  const base: TokenData = {
    accessToken: "at",
    refreshToken: "rt",
    clientId: "cid",
    clientSecret: "secret",
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // +1h
  };

  const cases: Array<{ name: string; mut: Partial<TokenData>; want: boolean }> = [
    { name: "far from expiry", mut: {}, want: false },
    {
      name: "expires in 10 minutes",
      mut: { expiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString() },
      want: false,
    },
    {
      name: "within threshold (4 min)",
      mut: { expiresAt: new Date(now.getTime() + 4 * 60 * 1000).toISOString() },
      want: true,
    },
    {
      name: "exactly at threshold",
      mut: { expiresAt: new Date(now.getTime() + REFRESH_THRESHOLD_MS).toISOString() },
      want: true,
    },
    {
      name: "already expired",
      mut: { expiresAt: new Date(now.getTime() - 1000).toISOString() },
      want: true,
    },
    { name: "no refresh token", mut: { refreshToken: undefined }, want: false },
    { name: "no client id", mut: { clientId: undefined }, want: false },
    { name: "no expiry (legacy)", mut: { expiresAt: undefined }, want: false },
    { name: "garbage expiry", mut: { expiresAt: "not-a-date" }, want: false },
  ];

  for (const c of cases) {
    test(c.name, () => {
      expect(shouldRefresh({ ...base, ...c.mut }, now)).toBe(c.want);
    });
  }
});
