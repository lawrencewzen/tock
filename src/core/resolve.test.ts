import { describe, expect, test } from "bun:test";
import type { Project } from "../api/schemas";
import { resolveProject } from "./resolve";

const projects: Project[] = [
  { id: "id-work", name: "Work Tasks" },
  { id: "id-home", name: "Home" },
  { id: "id-side", name: "Side Work" },
];

describe("resolveProject", () => {
  test("exact id match wins", () => {
    expect(resolveProject(projects, "id-home").id).toBe("id-home");
  });

  test("exact id wins even when other names contain the query", () => {
    expect(resolveProject(projects, "id-work").id).toBe("id-work");
  });

  test("unique name substring, case-insensitive", () => {
    expect(resolveProject(projects, "HOME").id).toBe("id-home");
  });

  test("no match throws", () => {
    expect(() => resolveProject(projects, "nonexistent")).toThrow(/no project matches/);
  });

  test("ambiguous match throws and lists candidates", () => {
    let message = "";
    try {
      resolveProject(projects, "work");
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain("multiple projects");
    for (const expected of ["Work Tasks", "Side Work", "id-work", "id-side"]) {
      expect(message).toContain(expected);
    }
  });
});
