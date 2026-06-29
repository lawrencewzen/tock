import { describe, expect, test } from "bun:test";
import { getProvider, isProviderName } from "./providers";

describe("getProvider", () => {
  test("ticktick preset", () => {
    const p = getProvider("ticktick");
    expect(p.authorizeUrl).toBe("https://ticktick.com/oauth/authorize");
    expect(p.tokenUrl).toBe("https://ticktick.com/oauth/token");
    expect(p.apiBase).toBe("https://api.ticktick.com/open/v1");
  });

  test("dida preset", () => {
    const p = getProvider("dida");
    expect(p.authorizeUrl).toBe("https://dida365.com/oauth/authorize");
    expect(p.tokenUrl).toBe("https://dida365.com/oauth/token");
    expect(p.apiBase).toBe("https://api.dida365.com/open/v1");
  });

  test("unknown provider throws", () => {
    expect(() => getProvider("todoist")).toThrow(/unknown provider/);
  });
});

describe("isProviderName", () => {
  test("accepts known names, rejects others", () => {
    expect(isProviderName("ticktick")).toBe(true);
    expect(isProviderName("dida")).toBe(true);
    expect(isProviderName("")).toBe(false);
    expect(isProviderName("TickTick")).toBe(false);
  });
});
