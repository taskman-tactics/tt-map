import { Routes } from '@angular/router';
import { BoardMap } from './board/board-map';
import { TerritoryAuthor } from './territory/territory-author';
import { TeamSidebar } from './viewer/team-sidebar';
import { TerritorySidebar } from './viewer/territory-sidebar';

export const routes: Routes = [
  {
    path: '',
    component: BoardMap,
    children: [
      { path: 'territories/:slug', component: TerritorySidebar },
      { path: 'teams/:id', component: TeamSidebar },
    ],
  },
  { path: 'author', component: TerritoryAuthor },
];
