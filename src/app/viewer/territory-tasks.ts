import type { Activity, Task } from './domain';

export type TerritoryTaskItem = {
  taskId: string;
  taskName: string;
  attackDiceRoll: string;
  strategy: string;
};

export type TerritoryActivityGroup = {
  activityId: string;
  activityName: string;
  tasks: TerritoryTaskItem[];
};

/**
 * Activity cards for a Territory: Activities A→Z, Tasks A→Z within each.
 * Activities with no Tasks are omitted.
 */
export function groupTerritoryTasks(
  activities: readonly Activity[],
  tasks: readonly Task[],
  territoryId: string,
): TerritoryActivityGroup[] {
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

  const groups: TerritoryActivityGroup[] = [];
  for (const activity of forTerritory) {
    const activityTasks = [...(byActivity.get(activity.id) ?? [])].sort(
      (a, b) => a.name.localeCompare(b.name),
    );
    if (activityTasks.length === 0) {
      continue;
    }
    groups.push({
      activityId: activity.id,
      activityName: activity.name,
      tasks: activityTasks.map((task) => ({
        taskId: task.id,
        taskName: task.name,
        attackDiceRoll: task.attackDiceRoll,
        strategy: task.strategy,
      })),
    });
  }
  return groups;
}
