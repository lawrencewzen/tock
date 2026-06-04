import { describe, expect, test } from "bun:test";
import type { Task } from "../api/schemas";
import { applyTaskUpdates, hasUpdates } from "./merge";

function existingTask(): Task {
  return {
    id: "tid",
    projectId: "pid",
    title: "original",
    content: "original content",
    priority: 1,
    status: 0,
    tags: ["old"],
  };
}

describe("applyTaskUpdates", () => {
  test("only provided fields are applied, rest preserved", () => {
    const next = applyTaskUpdates(existingTask(), { title: "renamed" });
    expect(next.title).toBe("renamed");
    expect(next.content).toBe("original content");
    expect(next.priority).toBe(1);
    expect(next.tags).toEqual(["old"]);
    // identity must never change — empty projectId triggers the duplicate-task bug
    expect(next.id).toBe("tid");
    expect(next.projectId).toBe("pid");
  });

  test("does not mutate the input task", () => {
    const task = existingTask();
    applyTaskUpdates(task, { title: "renamed", tags: ["new"] });
    expect(task.title).toBe("original");
    expect(task.tags).toEqual(["old"]);
  });

  test("priority, tags and dates", () => {
    const next = applyTaskUpdates(existingTask(), {
      priority: 5,
      tags: ["a", "b"],
      dueDate: "2026-06-05T18:00:00+0000",
      isAllDay: false,
    });
    expect(next.priority).toBe(5);
    expect(next.tags).toEqual(["a", "b"]);
    expect(next.dueDate).toBe("2026-06-05T18:00:00+0000");
    expect(next.isAllDay).toBe(false);
  });

  test("empty updates produce an identical copy", () => {
    const task = existingTask();
    expect(applyTaskUpdates(task, {})).toEqual(task);
  });

  test("undocumented passthrough fields survive the merge", () => {
    const task = { ...existingTask(), etag: "abc" } as Task;
    const next = applyTaskUpdates(task, { title: "renamed" });
    expect((next as Record<string, unknown>).etag).toBe("abc");
  });
});

describe("hasUpdates", () => {
  test("false for empty / all-undefined", () => {
    expect(hasUpdates({})).toBe(false);
    expect(hasUpdates({ title: undefined })).toBe(false);
  });

  test("true when any field is set, even falsy values", () => {
    expect(hasUpdates({ title: "" })).toBe(true);
    expect(hasUpdates({ priority: 0 })).toBe(true);
    expect(hasUpdates({ isAllDay: false })).toBe(true);
  });
});
