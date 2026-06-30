import { afterEach, describe, expect, test } from "bun:test";
import { ApiClient } from "./client";
import type { Task } from "./schemas";

type Handler = (req: Request) => Response | Promise<Response>;

let server: ReturnType<typeof Bun.serve<undefined, never>> | undefined;

function serve(handler: Handler): ApiClient {
  server = Bun.serve({ port: 0, fetch: handler });
  return new ApiClient(`http://localhost:${server.port}`, "test-token");
}

afterEach(() => {
  server?.stop(true);
  server = undefined;
});

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

describe("listProjects", () => {
  test("appends the virtual Inbox", async () => {
    const client = serve((req) => {
      expect(new URL(req.url).pathname).toBe("/project");
      expect(req.headers.get("authorization")).toBe("Bearer test-token");
      return json([{ id: "p1", name: "Work" }]);
    });
    const projects = await client.listProjects();
    expect(projects.map((p) => p.id)).toEqual(["p1", "inbox"]);
  });

  test("server error throws with status", async () => {
    const client = serve(() => new Response("boom", { status: 500 }));
    expect(client.listProjects()).rejects.toThrow(/500/);
  });
});

describe("listTasks", () => {
  test("unwraps tasks from the data endpoint", async () => {
    const client = serve((req) => {
      expect(new URL(req.url).pathname).toBe("/project/pid/data");
      return json({ project: { id: "pid", name: "Work" }, tasks: [{ id: "t1", title: "first" }] });
    });
    const tasks = await client.listTasks("pid");
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.id).toBe("t1");
  });

  test("missing tasks field yields empty array", async () => {
    const client = serve(() => json({ project: { id: "pid", name: "Work" } }));
    expect(await client.listTasks("pid")).toEqual([]);
  });
});

describe("getTask", () => {
  test("fetches by project and task id", async () => {
    const client = serve((req) => {
      expect(new URL(req.url).pathname).toBe("/project/pid/task/tid");
      return json({ id: "tid", projectId: "pid", title: "hello" });
    });
    const task = await client.getTask("pid", "tid");
    expect(task.title).toBe("hello");
  });
});

describe("createTask", () => {
  test("posts the task body", async () => {
    const client = serve(async (req) => {
      expect(req.method).toBe("POST");
      expect(new URL(req.url).pathname).toBe("/task");
      const body = (await req.json()) as Record<string, unknown>;
      expect(body.title).toBe("Buy milk");
      return json({ id: "generated", projectId: "pid", title: "Buy milk" });
    });
    const created = await client.createTask({ title: "Buy milk", projectId: "pid" });
    expect(created.id).toBe("generated");
  });
});

describe("updateTask", () => {
  const task: Task = { id: "tid", projectId: "pid", title: "renamed", priority: 0, status: 0 };

  test("posts to /task/{id} with id and projectId in body", async () => {
    const client = serve(async (req) => {
      expect(req.method).toBe("POST");
      expect(new URL(req.url).pathname).toBe("/task/tid");
      const body = (await req.json()) as Record<string, unknown>;
      // Non-empty projectId is what prevents the duplicate-task API bug.
      expect(body.id).toBe("tid");
      expect(body.projectId).toBe("pid");
      return json({ ...task });
    });
    const updated = await client.updateTask(task);
    expect(updated.title).toBe("renamed");
  });

  test("tolerates an empty response body, echoing the sent task", async () => {
    const client = serve(() => new Response("", { status: 200 }));
    const updated = await client.updateTask(task);
    expect(updated.id).toBe("tid");
    expect(updated.title).toBe("renamed");
  });

  test("refuses empty projectId without calling the API", async () => {
    let called = false;
    const client = serve(() => {
      called = true;
      return json({});
    });
    expect(client.updateTask({ ...task, projectId: "" })).rejects.toThrow(/projectId/);
    expect(called).toBe(false);
  });
});

describe("completeTask / deleteTask", () => {
  test("complete posts to the complete endpoint", async () => {
    const client = serve((req) => {
      expect(req.method).toBe("POST");
      expect(new URL(req.url).pathname).toBe("/project/pid/task/tid/complete");
      return new Response("", { status: 200 });
    });
    await client.completeTask("pid", "tid");
  });

  test("delete uses DELETE and tolerates empty body", async () => {
    const client = serve((req) => {
      expect(req.method).toBe("DELETE");
      expect(new URL(req.url).pathname).toBe("/project/pid/task/tid");
      return new Response("", { status: 200 });
    });
    await client.deleteTask("pid", "tid");
  });

  test("delete error surfaces status", async () => {
    const client = serve(() => new Response("nope", { status: 404 }));
    expect(client.deleteTask("pid", "tid")).rejects.toThrow(/404/);
  });
});
