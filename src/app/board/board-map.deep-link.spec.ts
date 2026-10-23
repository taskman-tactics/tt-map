import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  provideTippyConfig,
  provideTippyLoader,
  tooltipVariation,
} from '@ngneat/helipopper/config';
import { BoardMap } from './board-map';
import { TeamSidebar } from '../viewer/team-sidebar';
import { TerritorySidebar } from '../viewer/territory-sidebar';

/**
 * Cold-load regression: BoardMap must construct when the URL already has a
 * child Territory route (refresh / deep link). Previously threw on
 * ActivatedRoute.firstChild.snapshot during field init.
 */
describe('Viewer deep link routing', () => {
  function configure(): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          {
            path: '',
            component: BoardMap,
            children: [
              { path: 'territories/:slug', component: TerritorySidebar },
              { path: 'teams/:id', component: TeamSidebar },
            ],
          },
        ]),
        provideTippyLoader(() => import('tippy.js')),
        provideTippyConfig({
          defaultVariation: 'tooltip',
          variations: { tooltip: tooltipVariation },
        }),
      ],
    });
  }

  it('navigates to /territories/:slug without BoardMap construction error', async () => {
    configure();
    const router = TestBed.inject(Router);
    const ok = await router.navigateByUrl('/territories/barrows');
    expect(ok).toBe(true);
    expect(router.url).toContain('/territories/barrows');
  });

  it('navigates to /teams/:id without BoardMap construction error', async () => {
    configure();
    const router = TestBed.inject(Router);
    const ok = await router.navigateByUrl('/teams/4');
    expect(ok).toBe(true);
    expect(router.url).toContain('/teams/4');
  });
});
