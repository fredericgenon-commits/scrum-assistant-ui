import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'reports', pathMatch: 'full' },
  {
    path: 'teams',
    loadComponent: () => import('./features/teams/team-list.component').then(m => m.TeamListComponent)
  },
  {
    path: 'developers',
    loadComponent: () => import('./features/developers/developer-list.component').then(m => m.DeveloperListComponent)
  },
  {
    path: 'sprints',
    loadComponent: () => import('./features/sprints/sprint-list.component').then(m => m.SprintListComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/report-dashboard.component').then(m => m.ReportDashboardComponent)
  },
  {
    path: 'reports/developer/:id',
    loadComponent: () => import('./features/reports/developer-detail.component').then(m => m.DeveloperDetailComponent)
  }
];
