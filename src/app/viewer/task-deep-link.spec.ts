import { describe, expect, it } from 'vitest';
import { resolveTaskDeepLink } from './task-deep-link';

describe('resolveTaskDeepLink', () => {
  it('prefers a task id over an activity id', () => {
    expect(
      resolveTaskDeepLink({ task: 'task-1', activity: 'act-1' }),
    ).toEqual({ kind: 'task', id: 'task-1' });
  });

  it('resolves an activity deep link', () => {
    expect(resolveTaskDeepLink({ activity: 'act-9' })).toEqual({
      kind: 'activity',
      id: 'act-9',
    });
  });

  it('returns null when neither param is present', () => {
    expect(resolveTaskDeepLink({})).toBeNull();
    expect(resolveTaskDeepLink({ task: '', activity: '  ' })).toBeNull();
  });
});
