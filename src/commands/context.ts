import { ApiClient } from "../api/client";
import { refreshAccessToken } from "../api/oauth";
import { loadConfig, type Config } from "../core/config";
import { getProvider } from "../core/providers";
import { loadToken, saveToken, shouldRefresh, type TokenData } from "../core/token";

export interface CommandContext {
  readonly client: ApiClient;
  readonly config: Config;
}

/**
 * Loads config + token and returns an authenticated client, transparently
 * refreshing the access token when it expires within the threshold.
 */
export async function loadContext(): Promise<CommandContext> {
  const config = await loadConfig();
  const token = await loadToken();
  if (!token?.accessToken) {
    throw new Error("not initialized — run 'tock init' first");
  }

  const fresh = await maybeRefresh(config, token);
  const provider = getProvider(config.provider);
  return { client: new ApiClient(provider.apiBase, fresh.accessToken), config };
}

async function maybeRefresh(config: Config, token: TokenData): Promise<TokenData> {
  if (!shouldRefresh(token, new Date())) return token;

  const provider = getProvider(config.provider);
  const refreshed = await refreshAccessToken(
    provider,
    { clientId: token.clientId ?? "", clientSecret: token.clientSecret ?? "" },
    token.refreshToken ?? "",
  );

  const next: TokenData = {
    ...token,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? token.refreshToken,
    expiresAt: refreshed.expires_in
      ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
      : token.expiresAt,
  };
  await saveToken(next);
  return next;
}

/** The project a task command operates on: -P override, else config default. */
export function projectIdOf(projectIdFlag: string | undefined, config: Config): string {
  return projectIdFlag ?? config.defaultProjectId;
}
