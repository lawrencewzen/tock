import { Command } from "commander";
import type { Task } from "../api/schemas";
import { parsePriority, priorityName, STATUS_COMPLETED } from "../api/schemas";
import { toApiDate } from "../core/dates";
import { applyTaskUpdates, hasUpdates, type TaskFieldUpdates } from "../core/merge";
import { parseOutputFormat, printJson, printTable } from "../output";
import { loadContext, projectIdOf } from "./context";

interface TaskFieldFlags {
  title?: string;
  content?: string;
  priority?: number;
  tags?: string;
  start?: string;
  due?: string;
  allDay?: boolean;
  tz?: string;
  reminder?: string;
}

/** Converts CLI flag values into API-ready field updates. */
function fieldUpdatesFrom(flags: TaskFieldFlags): TaskFieldUpdates {
  return {
    title: flags.title,
    content: flags.content,
    priority: flags.priority,
    tags: flags.tags?.split(",").map((t) => t.trim()).filter((t) => t !== ""),
    startDate: flags.start !== undefined ? toApiDate(flags.start) : undefined,
    dueDate: flags.due !== undefined ? toApiDate(flags.due) : undefined,
    timeZone: flags.tz,
    isAllDay: flags.allDay,
    reminders: flags.reminder !== undefined ? [flags.reminder] : undefined,
  };
}

/** Registers the shared task field flags on a subcommand. */
function withFieldFlags(cmd: Command): Command {
  return cmd
    .option("-t, --title <title>", "task title")
    .option("-c, --content <content>", "free-form notes")
    .option("-p, --priority <level>", "none|low|medium|high", parsePriority)
    .option("--tags <tags>", "comma-separated tags")
    .option("--start <datetime>", "start (RFC3339, e.g. 2026-06-05T09:00:00Z)")
    .option("--due <datetime>", "due (RFC3339, e.g. 2026-06-05T18:00:00Z)")
    .option("--all-day", "mark as an all-day task")
    .option("--tz <zone>", "timezone, e.g. Asia/Shanghai")
    .option("--reminder <spec>", "reminder spec, e.g. TRIGGER:PT0S (at start) or TRIGGER:PT30M (30min before)");
}

function statusLabel(status: number): string {
  return status === STATUS_COMPLETED ? "done" : "open";
}

export function taskCommand(): Command {
  const cmd = new Command("task").description("Work with tasks in the current project");

  withFieldFlags(cmd.command("create"))
    .description("Create a task (requires -t)")
    .option("-o, --output <format>", "simple (default) or json", parseOutputFormat, "simple")
    .action(async (opts: TaskFieldFlags & { output: "simple" | "json" }, command: Command) => {
      if (!opts.title) throw new Error("a title is required (-t \"...\")");
      const { client, config } = await loadContext();
      const projectId = projectIdOf(globalProjectId(command), config);

      const base: Task = { id: "", projectId, title: opts.title, priority: 0, status: 0 };
      const { id: _unused, ...body } = applyTaskUpdates(base, fieldUpdatesFrom(opts));
      const created = await client.createTask({ ...body, title: opts.title, projectId });

      if (opts.output === "json") printJson(created);
      else console.log(`Created task ${created.id}`);
    });

  cmd
    .command("list")
    .description("List open tasks in the project")
    .option("-p, --priority <level>", "minimum priority: none|low|medium|high", parsePriority)
    .option("-t, --tag <tag>", "only tasks carrying this tag")
    .option("-o, --output <format>", "simple (default) or json", parseOutputFormat, "simple")
    .action(
      async (
        opts: { priority?: number; tag?: string; output: "simple" | "json" },
        command: Command,
      ) => {
        const { client, config } = await loadContext();
        const projectId = projectIdOf(globalProjectId(command), config);

        let tasks = await client.listTasks(projectId);
        if (opts.priority !== undefined) {
          tasks = tasks.filter((t) => t.priority >= (opts.priority ?? 0));
        }
        if (opts.tag !== undefined) {
          tasks = tasks.filter((t) => t.tags?.includes(opts.tag ?? "") ?? false);
        }

        if (opts.output === "json") {
          printJson(tasks);
          return;
        }
        if (tasks.length === 0) {
          console.log("No tasks found.");
          return;
        }
        printTable(
          ["ID", "PRIORITY", "STATUS", "TITLE"],
          tasks.map((t) => [t.id, priorityName(t.priority), statusLabel(t.status), t.title]),
        );
      },
    );

  cmd
    .command("show <task-id>")
    .description("Show one task in full")
    .option("-o, --output <format>", "simple (default) or json", parseOutputFormat, "simple")
    .action(async (taskId: string, opts: { output: "simple" | "json" }, command: Command) => {
      const { client, config } = await loadContext();
      const projectId = projectIdOf(globalProjectId(command), config);
      const task = await client.getTask(projectId, taskId);
      if (task.id !== taskId) {
        throw new Error(`task ${taskId} not found in project ${projectId}`);
      }

      if (opts.output === "json") {
        printJson(task);
        return;
      }
      printTaskDetail(task);
    });

  withFieldFlags(cmd.command("update <task-id>"))
    .description("Update fields of a task (only the flags you pass change)")
    .action(async (taskId: string, opts: TaskFieldFlags, command: Command) => {
      const updates = fieldUpdatesFrom(opts);
      if (!hasUpdates(updates)) {
        throw new Error("nothing to update — pass at least one field flag (e.g. -t, -p, --tags)");
      }

      const { client, config } = await loadContext();
      const projectId = projectIdOf(globalProjectId(command), config);

      const existing = await client.getTask(projectId, taskId);
      if (existing.id !== taskId) {
        throw new Error(`task ${taskId} not found in project ${projectId}`);
      }
      const merged = applyTaskUpdates(existing, updates);
      // Defensive: a blank projectId would make the API create a duplicate.
      if (!merged.projectId) merged.projectId = projectId;

      const updated = await client.updateTask(merged);
      console.log(`Updated task ${updated.id}`);
    });

  cmd
    .command("complete <task-id>")
    .description("Mark a task as completed")
    .action(async (taskId: string, _opts: unknown, command: Command) => {
      const { client, config } = await loadContext();
      const projectId = projectIdOf(globalProjectId(command), config);
      await client.completeTask(projectId, taskId);
      console.log(`Completed task ${taskId}`);
    });

  cmd
    .command("delete <task-id>")
    .description("Delete a task immediately (no confirmation)")
    .action(async (taskId: string, _opts: unknown, command: Command) => {
      const { client, config } = await loadContext();
      const projectId = projectIdOf(globalProjectId(command), config);
      await client.deleteTask(projectId, taskId);
      console.log(`Deleted task ${taskId}`);
    });

  return cmd;
}

/** Reads the program-level -P/--project-id option from any nesting depth. */
function globalProjectId(command: Command): string | undefined {
  const opts = command.optsWithGlobals<{ projectId?: string }>();
  return opts.projectId;
}

function printTaskDetail(task: Task): void {
  const lines: Array<[string, string]> = [
    ["ID", task.id],
    ["Project", task.projectId],
    ["Title", task.title],
    ["Status", statusLabel(task.status)],
    ["Priority", priorityName(task.priority)],
  ];
  if (task.content) lines.push(["Content", task.content]);
  if (task.tags?.length) lines.push(["Tags", task.tags.join(", ")]);
  if (task.startDate) lines.push(["Start", task.startDate]);
  if (task.dueDate) lines.push(["Due", task.dueDate]);
  if (task.isAllDay !== undefined) lines.push(["All-day", String(task.isAllDay)]);
  if (task.timeZone) lines.push(["Timezone", task.timeZone]);
  if (task.completedTime) lines.push(["Completed", task.completedTime]);
  for (const [key, value] of lines) console.log(`${key.padEnd(10)}${value}`);
}
