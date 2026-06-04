import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import type { ProviderName } from "./providers";

const ConfigSchema = z.object({
  provider: z.enum(["ticktick", "dida"]).default("ticktick"),
  defaultProjectId: z.string().default("inbox"),
});

export type Config = z.infer<typeof ConfigSchema>;

export const DEFAULT_CONFIG: Config = { provider: "ticktick", defaultProjectId: "inbox" };

/**
 * Directory holding config.json and token.json. Overridable via the
 * TOCK_CONFIG_DIR env var (also how tests point it at a temp dir).
 */
export function configDir(): string {
  return process.env.TOCK_CONFIG_DIR ?? join(homedir(), ".config", "tock");
}

function configFile(dir: string): string {
  return join(dir, "config.json");
}

/** Loads config, falling back to defaults when the file does not exist. */
export async function loadConfig(dir: string = configDir()): Promise<Config> {
  let raw: string;
  try {
    raw = await readFile(configFile(dir), "utf-8");
  } catch (error: unknown) {
    if (isNotFound(error)) return { ...DEFAULT_CONFIG };
    throw error;
  }
  const parsed = ConfigSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error(`invalid config at ${configFile(dir)}: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function saveConfig(config: Config, dir: string = configDir()): Promise<void> {
  await mkdir(dir, { recursive: true });
  await writeFile(configFile(dir), JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}

export type { ProviderName };
