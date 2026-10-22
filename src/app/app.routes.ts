import { Routes } from '@angular/router';
import { BoardMap } from './board/board-map';
import { TerritoryAuthor } from './territory/territory-author';
import { TerritorySidebar } from './viewer/territory-sidebar';

export const routes: Routes = [
  {
    path: '',
    component: BoardMap,
    children: [
      { path: 'territories/:slug', component: TerritorySidebar },
    ],
  },
  { path: 'author', component: TerritoryAuthor },
];
