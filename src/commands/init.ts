import { Command } from "commander";
import { buildAuthorizeUrl, exchangeCode, type OAuthCredentials } from "../api/oauth";
import { loadConfig, saveConfig } from "../core/config";
import { getProvider, type Provider } from "../core/providers";
import { loadToken, saveToken } from "../core/token";
import * as http from "http";
import { randomUUID } from "crypto";

const REDIRECT_PORT = 8080;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

/**
 * OAuth app credentials come from the environment (Bun auto-loads .env from
 * the working directory). TOCK_* take precedence; TICKTICK_* are accepted so
 * an existing TickTick developer setup works unchanged.
 */
function credentialsFromEnv(): OAuthCredentials {
  const clientId = process.env.TOCK_CLIENT_ID ?? process.env.TICKTICK_CLIENT_ID ?? "";
  const clientSecret = process.env.TOCK_CLIENT_SECRET ?? process.env.TICKTICK_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) {
    throw new Error(
      "missing OAuth credentials — set TOCK_CLIENT_ID and TOCK_CLIENT_SECRET " +
        "(or TICKTICK_CLIENT_ID/TICKTICK_CLIENT_SECRET) in the environment or a .env file",
    );
  }
  return { clientId, clientSecret };
}

function openBrowser(url: string): void {
  const opener =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    const { spawn } = require("child_process");
    spawn(opener, [url], { stdio: "ignore" });
  } catch {
    // Non-fatal: the URL is printed for manual opening.
  }
}

/** Serves the OAuth redirect endpoint until a code arrives. */
function waitForAuthCode(expectedState: string): { code: Promise<string>; stop: () => void } {
  let resolveCode: (code: string) => void;
  let rejectCode: (error: Error) => void;
  const code = new Promise<string>((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${REDIRECT_PORT}`);
    const received = url.searchParams.get("code");
    if (!received) {
      res.writeHead(400);
      res.end("Missing authorization code.");
      return;
    }
    if (url.searchParams.get("state") !== expectedState) {
      rejectCode(new Error("OAuth state mismatch — possible CSRF, aborting"));
      res.writeHead(400);
      res.end("State mismatch.");
      return;
    }
    resolveCode(received);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Authorization successful! You can close this window.");
  });

  server.listen(REDIRECT_PORT);

  return {
    code,
    stop: (): void => {
      server.close();
    },
  };
}

export async function runInitFlow(providerFlag: string | undefined): Promise<void> {
  const config = await loadConfig();
  const providerName = providerFlag ?? config.provider;
  const provider: Provider = getProvider(providerName);
  const credentials = credentialsFromEnv();

  const state = crypto.randomUUID();
  const { code, stop } = waitForAuthCode(state);
  try {
    const authorizeUrl = buildAuthorizeUrl(provider, credentials.clientId, REDIRECT_URI, state);
    console.error(`Opening browser for ${provider.name} authorization...`);
    console.error(`If it does not open, visit:\n  ${authorizeUrl}`);
    openBrowser(authorizeUrl);

    const authCode = await code;
    const tokens = await exchangeCode(provider, credentials, authCode, REDIRECT_URI);

    await saveToken({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : undefined,
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
    });
    await saveConfig({ ...config, provider: provider.name });
    console.log(`Initialized tock with ${provider.name}.`);
  } finally {
    stop();
  }
}

export function initCommand(): Command {
  return new Command("init")
    .description("Authenticate with TickTick/Dida365 via OAuth and store the token")
    .option("--provider <name>", "API provider: ticktick (default) or dida")
    .action(async (opts: { provider?: string }) => {
      const existing = await loadToken();
      if (existing?.accessToken) {
        throw new Error("already initialized — run 'tock reset' to re-authenticate");
      }
      await runInitFlow(opts.provider);
    });
}
