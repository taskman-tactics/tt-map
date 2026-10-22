import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Team, Territory } from './domain';
import {
  VISIBLE_POLL_MS,
  HIDDEN_POLL_MS,
  ViewerPoller,
  type ViewerPollerFetch,
} from './viewer-poller';

function team(id: string, points = 0): Team {
  return { id, name: id, color: '#000', points };
}

function territory(id: string, holdingTeamId: string | null = null): Territory {
  return {
    id,
    name: id,
    slug: id,
    defense: { base: 1, current: 1, max: 1 },
    holdingTeamId,
    capturedAt: null,
    regionId: null,
  };
}

describe('ViewerPoller', () => {
  let visibilityHidden = false;
  let visibilityListeners: Array<() => void> = [];
  let fetchHotCalls = 0;
  let fetchStaticCalls = 0;
  let poller: ViewerPoller;

  function createFetch(
    hotImpl?: () => Promise<{ territories: Territory[]; teams: Team[] }>,
  ): ViewerPollerFetch {
    fetchStaticCalls = 0;
    fetchHotCalls = 0;
    const defaultHot = async () => ({
      territories: [territory('t1')],
      teams: [team('a', 1)],
    });
    return {
      loadStatic: async () => {
        fetchStaticCalls += 1;
        return {
          regions: [{ id: 'r1', name: 'R' }],
          activities: [],
          tasks: [],
          players: [],
          geometryGroups: new Map(),
        };
      },
      loadHot: async () => {
        fetchHotCalls += 1;
        return (hotImpl ?? defaultHot)();
      },
    };
  }

  beforeEach(() => {
    // Only fake timeout APIs so async fetch Promises still settle normally.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    visibilityHidden = false;
    visibilityListeners = [];
  });

  afterEach(() => {
    poller?.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function start(fetch = createFetch()): Promise<ViewerPoller> {
    poller = new ViewerPoller(fetch, {
      isHidden: () => visibilityHidden,
      onChange: (cb) => {
        visibilityListeners.push(cb);
        return () => {
          visibilityListeners = visibilityListeners.filter((l) => l !== cb);
        };
      },
    });
    await poller.start();
    return poller;
  }

  it('loads static + hot data once, then polls hot data every 30s while visible', async () => {
    const p = await start();

    expect(p.state().status).toBe('ready');
    expect(fetchStaticCalls).toBe(1);
    expect(fetchHotCalls).toBe(1);

    await vi.advanceTimersByTimeAsync(VISIBLE_POLL_MS - 1);
    expect(fetchHotCalls).toBe(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(fetchHotCalls).toBe(2);
  });

  it('uses a 60s poll interval while the tab is hidden', async () => {
    visibilityHidden = true;
    await start();
    expect(fetchHotCalls).toBe(1);

    await vi.advanceTimersByTimeAsync(HIDDEN_POLL_MS - 1);
    expect(fetchHotCalls).toBe(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(fetchHotCalls).toBe(2);
  });

  it('reschedules when visibility changes and never stops polling', async () => {
    await start();

    visibilityHidden = true;
    visibilityListeners.forEach((cb) => cb());

    await vi.advanceTimersByTimeAsync(VISIBLE_POLL_MS);
    // after switch to hidden, the visible timer should have been cleared
    expect(fetchHotCalls).toBe(1);

    await vi.advanceTimersByTimeAsync(HIDDEN_POLL_MS);
    expect(fetchHotCalls).toBe(2);

    visibilityHidden = false;
    visibilityListeners.forEach((cb) => cb());
    await vi.advanceTimersByTimeAsync(VISIBLE_POLL_MS);
    expect(fetchHotCalls).toBe(3);
  });

  it('keeps the last good snapshot and sets stale on later poll errors', async () => {
    let fail = false;
    await start(
      createFetch(async () => {
        if (fail) {
          throw new Error('network');
        }
        return {
          territories: [territory('t1', 'a')],
          teams: [team('a', 5)],
        };
      }),
    );

    const ready = poller.state();
    expect(ready.status).toBe('ready');
    if (ready.status !== 'ready') {
      return;
    }
    expect(ready.stale).toBe(false);
    expect(ready.teams[0]?.points).toBe(5);

    fail = true;
    await vi.advanceTimersByTimeAsync(VISIBLE_POLL_MS);

    const stale = poller.state();
    expect(stale.status).toBe('ready');
    if (stale.status !== 'ready') {
      return;
    }
    expect(stale.stale).toBe(true);
    expect(stale.teams[0]?.points).toBe(5);
  });

  it('exposes failed when the first load errors with no snapshot yet', async () => {
    await start(
      createFetch(async () => {
        throw new Error('down');
      }),
    );

    expect(poller.state()).toEqual({ status: 'failed' });
  });

  it('retries the full first load after a failure', async () => {
    let attempts = 0;
    await start(
      createFetch(async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error('down');
        }
        return {
          territories: [territory('t1')],
          teams: [team('a', 1)],
        };
      }),
    );

    expect(poller.state().status).toBe('failed');

    await vi.advanceTimersByTimeAsync(VISIBLE_POLL_MS);
    expect(poller.state().status).toBe('ready');
    expect(attempts).toBe(2);
  });
});
