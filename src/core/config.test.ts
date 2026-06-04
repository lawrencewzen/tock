import { describe, expect, test } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_CONFIG, loadConfig, saveConfig } from "./config";

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "tock-test-"));
}

describe("config", () => {
  test("missing file falls back to defaults", async () => {
    const dir = await tempDir();
    const cfg = await loadConfig(dir);
    expect(cfg).toEqual(DEFAULT_CONFIG);
  });

  test("save/load round trip", async () => {
    const dir = await tempDir();
    await saveConfig({ provider: "dida", defaultProjectId: "abc123" }, dir);
    const cfg = await loadConfig(dir);
    expect(cfg.provider).toBe("dida");
    expect(cfg.defaultProjectId).toBe("abc123");
  });

  test("invalid provider in file throws a clear error", async () => {
    const dir = await tempDir();
    await writeFile(join(dir, "config.json"), JSON.stringify({ provider: "todoist" }));
    expect(loadConfig(dir)).rejects.toThrow(/invalid config/);
  });

  test("partial file is filled with defaults", async () => {
    const dir = await tempDir();
    await writeFile(join(dir, "config.json"), JSON.stringify({ provider: "dida" }));
    const cfg = await loadConfig(dir);
    expect(cfg.provider).toBe("dida");
    expect(cfg.defaultProjectId).toBe("inbox");
  });
});
