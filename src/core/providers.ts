export type ProviderName = "ticktick" | "dida";

export interface Provider {
  readonly name: ProviderName;
  readonly authorizeUrl: string;
  readonly tokenUrl: string;
  readonly apiBase: string;
}

/**
 * TickTick (international) and Dida365 (China) expose the identical Open API
 * on different domains. See docs/api-reference.md.
 */
export const PROVIDERS: Record<ProviderName, Provider> = {
  ticktick: {
    name: "ticktick",
    authorizeUrl: "https://ticktick.com/oauth/authorize",
    tokenUrl: "https://ticktick.com/oauth/token",
    apiBase: "https://api.ticktick.com/open/v1",
  },
  dida: {
    name: "dida",
    authorizeUrl: "https://dida365.com/oauth/authorize",
    tokenUrl: "https://dida365.com/oauth/token",
    apiBase: "https://api.dida365.com/open/v1",
  },
};

export function isProviderName(value: string): value is ProviderName {
  return value === "ticktick" || value === "dida";
}

export function getProvider(name: string): Provider {
  if (!isProviderName(name)) {
    throw new Error(`unknown provider '${name}' (expected 'ticktick' or 'dida')`);
  }
  return PROVIDERS[name];
}
