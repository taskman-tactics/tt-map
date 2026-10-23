import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideMaplibreWorker } from '@maplibre/ngx-maplibre-gl/config';
import {
  provideTippyConfig,
  provideTippyLoader,
  tooltipVariation,
  popperVariation,
} from '@ngneat/helipopper/config';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    provideMaplibreWorker('maplibre-gl-worker.mjs'),
    provideTippyLoader(() => import('tippy.js')),
    provideTippyConfig({
      defaultVariation: 'tooltip',
      variations: {
        tooltip: {
          ...tooltipVariation,
          theme: 'tt-dark',
          arrow: true,
          animation: 'scale',
          offset: [0, 8],
        },
        popper: popperVariation,
      },
    }),
  ],
};
