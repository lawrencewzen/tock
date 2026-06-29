import { describe, expect, test } from "bun:test";
import { toApiDate } from "./dates";

describe("toApiDate", () => {
  const cases: Array<{ name: string; input: string; want: string }> = [
    { name: "UTC Z form", input: "2026-06-05T18:00:00Z", want: "2026-06-05T18:00:00+0000" },
    { name: "strips milliseconds", input: "2026-06-05T18:00:00.123Z", want: "2026-06-05T18:00:00+0000" },
    {
      name: "normalizes offset to UTC",
      input: "2026-06-05T18:00:00+08:00",
      want: "2026-06-05T10:00:00+0000",
    },
    { name: "date-only midnight UTC", input: "2026-06-05", want: "2026-06-05T00:00:00+0000" },
  ];

  for (const c of cases) {
    test(c.name, () => {
      expect(toApiDate(c.input)).toBe(c.want);
    });
  }

  test("garbage input throws", () => {
    expect(() => toApiDate("not-a-date")).toThrow(/invalid date/);
  });
});
