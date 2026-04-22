import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'cases', loadComponent: () => import('./features/cases/case-list/case-list').then(m => m.CaseListComponent), canActivate: [roleGuard], data: { roles: ['SUBMITTER', 'ADMIN'] } },
      { path: 'cases/create', loadComponent: () => import('./features/cases/case-form/case-form').then(m => m.CaseFormComponent), canActivate: [roleGuard], data: { roles: ['SUBMITTER', 'ADMIN'] } },
      { path: 'cases/edit/:id', loadComponent: () => import('./features/cases/case-form/case-form').then(m => m.CaseFormComponent), canActivate: [roleGuard], data: { roles: ['SUBMITTER', 'ADMIN'] } },
      { path: 'cases/:id', loadComponent: () => import('./features/cases/case-detail/case-detail').then(m => m.CaseDetailComponent) },
      { path: 'review', loadComponent: () => import('./features/review/review-queue/review-queue').then(m => m.ReviewQueueComponent), canActivate: [roleGuard], data: { roles: ['REVIEWER', 'ADMIN'] } },
      { path: 'review/:id', loadComponent: () => import('./features/review/review-workspace/review-workspace').then(m => m.ReviewWorkspaceComponent), canActivate: [roleGuard], data: { roles: ['REVIEWER', 'ADMIN'] } },
      { path: 'approval', loadComponent: () => import('./features/approval/approval-queue/approval-queue').then(m => m.ApprovalQueueComponent), canActivate: [roleGuard], data: { roles: ['APPROVER', 'ADMIN'] } },
      { path: 'approval/:id', loadComponent: () => import('./features/approval/approval-workspace/approval-workspace').then(m => m.ApprovalWorkspaceComponent), canActivate: [roleGuard], data: { roles: ['APPROVER', 'ADMIN'] } },
      { path: 'reports', loadComponent: () => import('./features/reports/reports').then(m => m.ReportsComponent), canActivate: [roleGuard], data: { roles: ['MANAGEMENT', 'ADMIN', 'AUDITOR'] } },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications').then(m => m.NotificationsComponent) },
      { path: 'audit', loadComponent: () => import('./features/audit/audit').then(m => m.AuditComponent), canActivate: [roleGuard], data: { roles: ['AUDITOR', 'ADMIN'] } },
      { path: 'admin/master-data', loadComponent: () => import('./features/admin/master-data/master-data').then(m => m.MasterDataComponent), canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'admin/workflows', loadComponent: () => import('./features/admin/workflows/workflows').then(m => m.WorkflowsComponent), canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'admin/routing', loadComponent: () => import('./features/admin/routing-rules/routing-rules').then(m => m.RoutingRulesComponent), canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'admin/users', loadComponent: () => import('./features/admin/user-management/user-management').then(m => m.UserManagementComponent), canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFoundComponent) },
    ],
  },
  { path: '**', loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFoundComponent) },
];
