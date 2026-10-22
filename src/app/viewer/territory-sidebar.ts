import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { ViewerDataService } from './viewer-data';
import { resolveTerritorySelection } from './territory-selection';

@Component({
  selector: 'app-territory-sidebar',
  templateUrl: './territory-sidebar.html',
  styleUrl: './territory-sidebar.scss',
})
export class TerritorySidebar {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewer = inject(ViewerDataService);

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug'))),
    { initialValue: null as string | null },
  );

  protected readonly selection = computed(() => {
    const state = this.viewer.state();
    const slug = this.slug();
    if (state.status !== 'ready') {
      return slug
        ? { slug, name: slug, hasGeometry: false }
        : null;
    }
    return resolveTerritorySelection({
      slug,
      territories: state.territories,
      geometryGroups: state.geometryGroups,
    });
  });

  protected close(): void {
    void this.router.navigate(['/']);
  }
}
