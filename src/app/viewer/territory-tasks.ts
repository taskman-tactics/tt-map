import type { Activity, Task } from './domain';

export type TerritoryTaskLine = {
  activityId: string;
  activityName: string;
  taskId: string;
  taskName: string;
  attackDiceRoll: string;
  strategy: string;
};

/**
 * Flat Task lines for a Territory, Activities A→Z then Tasks A→Z within.
 */
export function groupTerritoryTasks(
  activities: readonly Activity[],
  tasks: readonly Task[],
  territoryId: string,
): TerritoryTaskLine[] {
  const forTerritory = activities
    .filter((a) => a.territoryId === territoryId)
    .sort((a, b) => a.name.localeCompare(b.name));

  const byActivity = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.activityId == null) {
      continue;
    }
    const list = byActivity.get(task.activityId);
    if (list) {
      list.push(task);
    } else {
      byActivity.set(task.activityId, [task]);
    }
  }

  const lines: TerritoryTaskLine[] = [];
  for (const activity of forTerritory) {
    const activityTasks = [...(byActivity.get(activity.id) ?? [])].sort(
      (a, b) => a.name.localeCompare(b.name),
    );
    for (const task of activityTasks) {
      lines.push({
        activityId: activity.id,
        activityName: activity.name,
        taskId: task.id,
        taskName: task.name,
        attackDiceRoll: task.attackDiceRoll,
        strategy: task.strategy,
      });
    }
  }
  return lines;
}
