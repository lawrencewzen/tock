import { z } from "zod";

/**
 * Schemas for API boundary validation (docs/api-reference.md). All use
 * looseObject so undocumented fields pass through untouched — important for
 * update's read-modify-write, which re-submits the whole fetched object.
 */

export const ChecklistItemSchema = z.looseObject({
  id: z.string().optional(),
  title: z.string().optional(),
  status: z.number().optional(),
});

export const TaskSchema = z.looseObject({
  id: z.string(),
  projectId: z.string().default(""),
  title: z.string().default(""),
  content: z.string().optional(),
  desc: z.string().optional(),
  isAllDay: z.boolean().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  completedTime: z.string().optional(),
  timeZone: z.string().optional(),
  priority: z.number().default(0),
  status: z.number().default(0),
  reminders: z.array(z.string()).optional(),
  repeatFlag: z.string().optional(),
  sortOrder: z.number().optional(),
  tags: z.array(z.string()).optional(),
  items: z.array(ChecklistItemSchema).optional(),
  kind: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export const ProjectSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  color: z.string().nullish(),
  sortOrder: z.number().optional(),
  closed: z.boolean().nullish(),
  groupId: z.string().nullish(),
  viewMode: z.string().nullish(),
  permission: z.string().nullish(),
  kind: z.string().nullish(),
});

export type Project = z.infer<typeof ProjectSchema>;

/** GET /project/{id}/data response. */
export const ProjectDataSchema = z.looseObject({
  project: ProjectSchema.optional(),
  tasks: z.array(TaskSchema).default([]),
});

export const TokenResponseSchema = z.looseObject({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  token_type: z.string().optional(),
});

export type TokenResponse = z.infer<typeof TokenResponseSchema>;

/**
 * The Inbox is a real project with the well-known id `inbox`, but the API
 * omits it from GET /project; clients append it manually.
 */
export const INBOX_PROJECT: Project = { id: "inbox", name: "Inbox" };

export const PRIORITIES = { none: 0, low: 1, medium: 3, high: 5 } as const;

export type PriorityName = keyof typeof PRIORITIES;

export function parsePriority(name: string): number {
  const key = name.toLowerCase() as PriorityName;
  if (!(key in PRIORITIES)) {
    throw new Error(`invalid priority '${name}' (expected none|low|medium|high)`);
  }
  return PRIORITIES[key];
}

export function priorityName(value: number): string {
  const entry = Object.entries(PRIORITIES).find(([, v]) => v === value);
  return entry ? entry[0] : String(value);
}

export const STATUS_OPEN = 0;
export const STATUS_COMPLETED = 2;
