import type {
  Activity,
  Player,
  Region,
  Task,
  Team,
  Territory,
} from './domain';
import type { GeometryGroups } from './territory-geometry';

export const VISIBLE_POLL_MS = 30_000;
export const HIDDEN_POLL_MS = 60_000;

export type { GeometryGroups };

export type ViewerStaticSlice = {
  regions: Region[];
  activities: Activity[];
  tasks: Task[];
  players: Player[];
  geometryGroups: GeometryGroups;
};

export type ViewerHotSlice = {
  territories: Territory[];
  teams: Team[];
};

export type ViewerPollerFetch = {
  loadStatic: () => Promise<ViewerStaticSlice>;
  loadHot: () => Promise<ViewerHotSlice>;
};

export type VisibilitySource = {
  isHidden: () => boolean;
  onChange: (callback: () => void) => () => void;
};

export type ViewerDataState =
  | { status: 'loading' }
  | { status: 'failed' }
  | {
      status: 'ready';
      stale: boolean;
      regions: Region[];
      activities: Activity[];
      tasks: Task[];
      players: Player[];
      territories: Territory[];
      teams: Team[];
      geometryGroups: GeometryGroups;
    };

/**
 * Read-only poller for Viewer game state (ADR-0003).
 * Territories + Teams poll on an interval; everything else loads once.
 */
export class ViewerPoller {
  private readonly fetch: ViewerPollerFetch;
  private readonly visibility: VisibilitySource;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribeVisibility: (() => void) | null = null;
  private running = false;
  private staticSlice: ViewerStaticSlice | null = null;
  private hotSlice: ViewerHotSlice | null = null;
  private current: ViewerDataState = { status: 'loading' };
  private readonly listeners = new Set<() => void>();

  constructor(fetch: ViewerPollerFetch, visibility: VisibilitySource) {
    this.fetch = fetch;
    this.visibility = visibility;
  }

  state(): ViewerDataState {
    return this.current;
  }

  /** Subscribe to state changes; returns unsubscribe. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Starts polling; the returned promise settles when the first load attempt finishes. */
  start(): Promise<void> {
    if (this.running) {
      return Promise.resolve();
    }
    this.running = true;
    this.unsubscribeVisibility = this.visibility.onChange(() => {
      if (!this.running) {
        return;
      }
      this.scheduleNext();
    });
    return this.loadInitial();
  }

  stop(): void {
    this.running = false;
    this.clearTimer();
    this.unsubscribeVisibility?.();
    this.unsubscribeVisibility = null;
  }

  private setState(next: ViewerDataState): void {
    this.current = next;
    for (const listener of this.listeners) {
      listener();
    }
  }

  private clearTimer(): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private pollDelayMs(): number {
    return this.visibility.isHidden() ? HIDDEN_POLL_MS : VISIBLE_POLL_MS;
  }

  private scheduleNext(): void {
    this.clearTimer();
    if (!this.running) {
      return;
    }
    this.timer = setTimeout(() => {
      void this.pollHot();
    }, this.pollDelayMs());
  }

  private readyState(stale: boolean): ViewerDataState {
    if (this.staticSlice == null || this.hotSlice == null) {
      return { status: 'failed' };
    }
    return {
      status: 'ready',
      stale,
      ...this.staticSlice,
      ...this.hotSlice,
    };
  }

  private async loadInitial(): Promise<void> {
    this.setState({ status: 'loading' });
    try {
      const [staticSlice, hotSlice] = await Promise.all([
        this.fetch.loadStatic(),
        this.fetch.loadHot(),
      ]);
      if (!this.running) {
        return;
      }
      this.staticSlice = staticSlice;
      this.hotSlice = hotSlice;
      this.setState(this.readyState(false));
      this.scheduleNext();
    } catch {
      if (!this.running) {
        return;
      }
      this.setState({ status: 'failed' });
      this.scheduleNext();
    }
  }

  private async pollHot(): Promise<void> {
    if (!this.running) {
      return;
    }
    // Without a good snapshot, retry the full first load (static + hot).
    if (this.staticSlice == null || this.hotSlice == null) {
      await this.loadInitial();
      return;
    }
    try {
      const hotSlice = await this.fetch.loadHot();
      if (!this.running) {
        return;
      }
      this.hotSlice = hotSlice;
      this.setState(this.readyState(false));
    } catch {
      if (!this.running) {
        return;
      }
      this.setState(this.readyState(true));
    }
    this.scheduleNext();
  }
}
