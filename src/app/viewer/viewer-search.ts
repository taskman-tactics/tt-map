import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  resolveSearchSelection,
  type SearchSelectionIntent,
} from './search-selection';
import {
  searchResults,
  type SearchCatalog,
  type SearchGroup,
  type SearchHit,
  type SearchKind,
} from './search-results';
import { shouldHandleSearchShortcut } from './search-shortcut';
import { ViewerDataService } from './viewer-data';

const KIND_LABEL: Record<SearchKind, string> = {
  territory: 'Territories',
  region: 'Regions',
  activity: 'Activities',
  task: 'Tasks',
  team: 'Teams',
  player: 'Players',
};

@Component({
  selector: 'app-viewer-search',
  templateUrl: './viewer-search.html',
  styleUrl: './viewer-search.scss',
})
export class ViewerSearch {
  private readonly viewer = inject(ViewerDataService);
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Selection intents (routes + region fit) handled by the map host. */
  readonly selectIntent = output<SearchSelectionIntent>();

  private readonly inputEl =
    viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  private readonly catalog = computed((): SearchCatalog | null => {
    const state = this.viewer.state();
    if (state.status !== 'ready') {
      return null;
    }
    return {
      territories: state.territories,
      regions: state.regions,
      activities: state.activities,
      tasks: state.tasks,
      teams: state.teams,
      players: state.players,
    };
  });

  protected readonly groups = computed((): SearchGroup[] => {
    const catalog = this.catalog();
    if (!catalog) {
      return [];
    }
    return searchResults(catalog, this.query());
  });

  protected readonly flatHits = computed((): SearchHit[] =>
    this.groups().flatMap((g) => g.hits),
  );

  protected kindLabel = (kind: SearchKind): string => KIND_LABEL[kind];

  constructor() {
    const onKeydown = (event: KeyboardEvent) => {
      if (this.open() && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.closeSearch();
        return;
      }
      if (!shouldHandleSearchShortcut(event)) {
        return;
      }
      event.preventDefault();
      this.openSearch();
    };
    window.addEventListener('keydown', onKeydown, true);

    const onPointerDown = (event: PointerEvent) => {
      if (!this.open()) {
        return;
      }
      const target = event.target;
      if (
        target instanceof Node &&
        !this.host.nativeElement.contains(target)
      ) {
        this.closeSearch();
      }
    };
    window.addEventListener('pointerdown', onPointerDown);

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('keydown', onKeydown, true);
      window.removeEventListener('pointerdown', onPointerDown);
    });
  }

  protected openSearch(): void {
    this.open.set(true);
    queueMicrotask(() => {
      this.inputEl()?.nativeElement.focus();
      this.inputEl()?.nativeElement.select();
    });
  }

  protected closeSearch(): void {
    this.open.set(false);
    this.query.set('');
    this.activeIndex.set(0);
  }

  protected onQueryInput(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    const hits = this.flatHits();
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeSearch();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (hits.length === 0) {
        return;
      }
      this.activeIndex.set((this.activeIndex() + 1) % hits.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (hits.length === 0) {
        return;
      }
      this.activeIndex.set(
        (this.activeIndex() - 1 + hits.length) % hits.length,
      );
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const hit = hits[this.activeIndex()];
      if (hit) {
        this.choose(hit);
      }
    }
  }

  protected isActive(hit: SearchHit): boolean {
    const hits = this.flatHits();
    const index = hits.indexOf(hit);
    return index >= 0 && index === this.activeIndex();
  }

  protected choose(hit: SearchHit): void {
    const catalog = this.catalog();
    if (!catalog) {
      return;
    }
    const intent = resolveSearchSelection(hit, catalog);
    if (!intent) {
      return;
    }
    this.selectIntent.emit(intent);
    this.closeSearch();
  }

  protected flatIndex(hit: SearchHit): number {
    return this.flatHits().indexOf(hit);
  }
}
