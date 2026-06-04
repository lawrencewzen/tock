import { z } from "zod";
import {
  INBOX_PROJECT,
  ProjectDataSchema,
  ProjectSchema,
  TaskSchema,
  type Project,
  type Task,
} from "./schemas";

/**
 * Thin authenticated wrapper over the TickTick/Dida365 Open API
 * (docs/api-reference.md). Methods return schema-validated objects.
 */
export class ApiClient {
  constructor(
    private readonly apiBase: string,
    private readonly accessToken: string,
  ) {}

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(`${this.apiBase}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`${method} ${path} failed (${response.status}): ${text}`);
    }
    if (text === "") return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return undefined; // some endpoints (complete/delete) return non-JSON bodies
    }
  }

  /** Lists projects, appending the virtual Inbox the API omits. */
  async listProjects(): Promise<Project[]> {
    const data = await this.request("GET", "/project");
    const projects = z.array(ProjectSchema).parse(data ?? []);
    projects.push({ ...INBOX_PROJECT });
    return projects;
  }

  /** Lists the (open) tasks of a project via the /data endpoint. */
  async listTasks(projectId: string): Promise<Task[]> {
    const data = await this.request("GET", `/project/${projectId}/data`);
    return ProjectDataSchema.parse(data ?? {}).tasks;
  }

  async getTask(projectId: string, taskId: string): Promise<Task> {
    const data = await this.request("GET", `/project/${projectId}/task/${taskId}`);
    return TaskSchema.parse(data);
  }

  async createTask(task: Partial<Task> & { title: string; projectId: string }): Promise<Task> {
    const data = await this.request("POST", "/task", task);
    return TaskSchema.parse(data);
  }

  /**
   * Updates a task. The body must carry non-empty id and projectId — with an
   * empty projectId the API silently CREATES a duplicate task instead of
   * updating (verified live), so this guards before sending.
   */
  async updateTask(task: Task): Promise<Task> {
    if (!task.id || !task.projectId) {
      throw new Error("updateTask requires non-empty id and projectId (empty projectId would create a duplicate task)");
    }
    const data = await this.request("POST", `/task/${task.id}`, task);
    return TaskSchema.parse(data);
  }

  async completeTask(projectId: string, taskId: string): Promise<void> {
    await this.request("POST", `/project/${projectId}/task/${taskId}/complete`);
  }

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    await this.request("DELETE", `/project/${projectId}/task/${taskId}`);
  }
}
