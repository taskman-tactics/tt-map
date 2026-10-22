export type TaskDeepLink =
  | { kind: 'task'; id: string }
  | { kind: 'activity'; id: string };

/** Parse `?task=` / `?activity=` query params into a scroll+highlight target. */
export function resolveTaskDeepLink(query: {
  task?: string | null;
  activity?: string | null;
}): TaskDeepLink | null {
  const task = query.task?.trim() || null;
  if (task) {
    return { kind: 'task', id: task };
  }
  const activity = query.activity?.trim() || null;
  if (activity) {
    return { kind: 'activity', id: activity };
  }
  return null;
}
