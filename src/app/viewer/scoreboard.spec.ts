import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Team } from './domain';
import { Scoreboard } from './scoreboard';
import { ViewerDataService } from './viewer-data';
import type { ViewerDataState } from './viewer-poller';

function team(id: string, points: number): Team {
  return {
    id,
    name: `Team ${id}`,
    color: '#1C78E0',
    points,
    avatarUrl: null,
    iconUrl: null,
  };
}

describe('Scoreboard', () => {
  it('renders the floating scoreboard when Viewer data is ready', async () => {
    const state = signal<ViewerDataState>({
      status: 'ready',
      stale: false,
      regions: [],
      activities: [],
      tasks: [],
      players: [],
      territories: [],
      teams: [team('a', 1), team('b', 2), team('c', 3), team('d', 4)],
      geometryGroups: new Map(),
    });

    TestBed.configureTestingModule({
      imports: [Scoreboard],
      providers: [
        provideRouter([]),
        { provide: ViewerDataService, useValue: { state } },
      ],
    });

    const fixture = TestBed.createComponent(Scoreboard);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.scoreboard')).not.toBeNull();
    expect(root.querySelectorAll('.scoreboard__team').length).toBe(4);
  });
});
