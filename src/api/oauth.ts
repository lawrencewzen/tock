import type { Provider } from "../core/providers";
import { TokenResponseSchema, type TokenResponse } from "./schemas";

export const OAUTH_SCOPE = "tasks:write tasks:read";

export interface OAuthCredentials {
  readonly clientId: string;
  readonly clientSecret: string;
}

export function buildAuthorizeUrl(
  provider: Provider,
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: OAUTH_SCOPE,
    state,
    redirect_uri: redirectUri,
    response_type: "code",
  });
  return `${provider.authorizeUrl}?${params.toString()}`;
}

async function postTokenForm(
  provider: Provider,
  credentials: OAuthCredentials,
  form: Record<string, string>,
): Promise<TokenResponse> {
  const basic = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64");
  const response = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form).toString(),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`token request failed (${response.status}): ${body}`);
  }
  const parsed = TokenResponseSchema.safeParse(JSON.parse(body));
  if (!parsed.success) {
    throw new Error(`unexpected token response: ${parsed.error.message}`);
  }
  return parsed.data;
}

/** Exchanges an authorization code for tokens. */
export async function exchangeCode(
  provider: Provider,
  credentials: OAuthCredentials,
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  return postTokenForm(provider, credentials, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
}

/** Trades a refresh token for a fresh access token. */
export async function refreshAccessToken(
  provider: Provider,
  credentials: OAuthCredentials,
  refreshToken: string,
): Promise<TokenResponse> {
  return postTokenForm(provider, credentials, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}
