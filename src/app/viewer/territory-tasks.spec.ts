import { describe, expect, it } from 'vitest';
import type { Activity, Task } from './domain';
import { groupTerritoryTasks } from './territory-tasks';

function activity(
  id: string,
  name: string,
  territoryId: string | null,
): Activity {
  return { id, name, territoryId };
}

function task(
  id: string,
  name: string,
  activityId: string | null,
  extras: Partial<Pick<Task, 'attackDiceRoll' | 'strategy'>> = {},
): Task {
  return {
    id,
    name,
    attackDiceRoll: extras.attackDiceRoll ?? '1d6',
    strategy: extras.strategy ?? 'regular',
    activityId,
  };
}

describe('groupTerritoryTasks', () => {
  it('groups Tasks under Activities for one Territory, both A→Z', () => {
    const activities = [
      activity('a2', 'Zulrah', 't1'),
      activity('a1', 'Cerberus', 't1'),
      activity('a3', 'Other', 't2'),
    ];
    const tasks = [
      task('k2', 'Jar', 'a1', { attackDiceRoll: '1d4', strategy: 'regular' }),
      task('k1', 'Crystal', 'a1', {
        attackDiceRoll: '1d8',
        strategy: 'machine-gun',
      }),
      task('k3', 'Pet', 'a2'),
      task('k4', 'Skip', 'a3'),
    ];

    expect(groupTerritoryTasks(activities, tasks, 't1')).toEqual([
      {
        activityId: 'a1',
        activityName: 'Cerberus',
        taskId: 'k1',
        taskName: 'Crystal',
        attackDiceRoll: '1d8',
        strategy: 'machine-gun',
      },
      {
        activityId: 'a1',
        activityName: 'Cerberus',
        taskId: 'k2',
        taskName: 'Jar',
        attackDiceRoll: '1d4',
        strategy: 'regular',
      },
      {
        activityId: 'a2',
        activityName: 'Zulrah',
        taskId: 'k3',
        taskName: 'Pet',
        attackDiceRoll: '1d6',
        strategy: 'regular',
      },
    ]);
  });

  it('returns an empty list when the Territory has no Activities', () => {
    expect(
      groupTerritoryTasks(
        [activity('a1', 'Cerberus', 't2')],
        [task('k1', 'Jar', 'a1')],
        't1',
      ),
    ).toEqual([]);
  });
});
