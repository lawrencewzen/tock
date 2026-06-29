import type { Task } from "../api/schemas";

/**
 * Field changes for `task update`. `undefined` means "flag not passed, leave
 * the field as-is" — commander naturally produces undefined for unset options,
 * which doubles as the changed-detection.
 */
export interface TaskFieldUpdates {
  readonly title?: string;
  readonly content?: string;
  readonly priority?: number;
  readonly tags?: readonly string[];
  /** Already API-formatted (see core/dates.ts). */
  readonly startDate?: string;
  readonly dueDate?: string;
  readonly timeZone?: string;
  readonly isAllDay?: boolean;
  readonly reminders?: readonly string[];
}

export function hasUpdates(updates: TaskFieldUpdates): boolean {
  return Object.values(updates).some((value) => value !== undefined);
}

/**
 * Read-modify-write merge: returns a copy of the fetched task with only the
 * provided fields overwritten. Never touches id/projectId — those must reach
 * the update endpoint intact, or the API creates a duplicate task.
 */
export function applyTaskUpdates(task: Readonly<Task>, updates: TaskFieldUpdates): Task {
  const next: Task = { ...task };
  if (updates.title !== undefined) next.title = updates.title;
  if (updates.content !== undefined) next.content = updates.content;
  if (updates.priority !== undefined) next.priority = updates.priority;
  if (updates.tags !== undefined) next.tags = [...updates.tags];
  if (updates.startDate !== undefined) next.startDate = updates.startDate;
  if (updates.dueDate !== undefined) next.dueDate = updates.dueDate;
  if (updates.timeZone !== undefined) next.timeZone = updates.timeZone;
  if (updates.isAllDay !== undefined) next.isAllDay = updates.isAllDay;
  if (updates.reminders !== undefined) next.reminders = [...updates.reminders];
  return next;
}
