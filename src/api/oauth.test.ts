import { afterEach, describe, expect, test } from "bun:test";
import type { Provider } from "../core/providers";
import { buildAuthorizeUrl, exchangeCode, refreshAccessToken } from "./oauth";

let server: ReturnType<typeof Bun.serve<undefined, never>> | undefined;

function fakeProvider(handler: (req: Request) => Response | Promise<Response>): Provider {
  server = Bun.serve({ port: 0, fetch: handler });
  const base = `http://localhost:${server.port}`;
  return {
    name: "ticktick",
    authorizeUrl: `${base}/oauth/authorize`,
    tokenUrl: `${base}/oauth/token`,
    apiBase: `${base}/open/v1`,
  };
}

afterEach(() => {
  server?.stop(true);
  server = undefined;
});

const creds = { clientId: "cid", clientSecret: "secret" };

describe("buildAuthorizeUrl", () => {
  test("contains all OAuth params", () => {
    const provider: Provider = {
      name: "ticktick",
      authorizeUrl: "https://ticktick.com/oauth/authorize",
      tokenUrl: "https://ticktick.com/oauth/token",
      apiBase: "https://api.ticktick.com/open/v1",
    };
    const url = new URL(buildAuthorizeUrl(provider, "cid", "http://localhost:8080", "xyz"));
    expect(url.searchParams.get("client_id")).toBe("cid");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:8080");
    expect(url.searchParams.get("state")).toBe("xyz");
    expect(url.searchParams.get("scope")).toContain("tasks:write");
  });
});

describe("exchangeCode", () => {
  test("sends form body with basic auth and parses tokens", async () => {
    const provider = fakeProvider(async (req) => {
      expect(req.headers.get("authorization")).toBe(`Basic ${btoa("cid:secret")}`);
      const form = new URLSearchParams(await req.text());
      expect(form.get("grant_type")).toBe("authorization_code");
      expect(form.get("code")).toBe("the-code");
      return Response.json({ access_token: "at", refresh_token: "rt", expires_in: 3600 });
    });
    const tokens = await exchangeCode(provider, creds, "the-code", "http://localhost:8080");
    expect(tokens.access_token).toBe("at");
    expect(tokens.refresh_token).toBe("rt");
    expect(tokens.expires_in).toBe(3600);
  });
});

describe("refreshAccessToken", () => {
  test("sends refresh grant", async () => {
    const provider = fakeProvider(async (req) => {
      const form = new URLSearchParams(await req.text());
      expect(form.get("grant_type")).toBe("refresh_token");
      expect(form.get("refresh_token")).toBe("old-rt");
      return Response.json({ access_token: "new-at" });
    });
    const tokens = await refreshAccessToken(provider, creds, "old-rt");
    expect(tokens.access_token).toBe("new-at");
  });

  test("rejected refresh throws with status", async () => {
    const provider = fakeProvider(() => Response.json({ error: "invalid_grant" }, { status: 400 }));
    expect(refreshAccessToken(provider, creds, "expired")).rejects.toThrow(/400/);
  });
});
