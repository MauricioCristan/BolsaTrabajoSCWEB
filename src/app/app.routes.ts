import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { ADMIN_ROUTES } from './features/admin/admin-routes';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/password-confirm/password-confirm.component').then((m) => m.PasswordConfirmComponent),
  },
  {
    path: 'set-password',
    loadComponent: () =>
      import('./features/auth/password-confirm/password-confirm.component').then((m) => m.PasswordConfirmComponent),
  },

  {
    path: 'register-company',
    loadComponent: () =>
      import('./features/auth/register-company/register-company.component').then((m) => m.RegisterCompanyComponent),
  },
  {
    path: 'jobs',
    loadComponent: () =>
      import('./features/jobs/pages/list/job-list.component').then((m) => m.JobListComponent),
  },
  {
    path: 'jobs/:id',
    loadComponent: () =>
      import('./features/jobs/pages/detail/job-detail.component').then((m) => m.JobDetailComponent),
  },
  {
    path: 'company',
    redirectTo: ADMIN_ROUTES.JOBS.LIST.FULL_PATH,
  },

  {
    path: ADMIN_ROUTES.ROOT.PATH,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: 'empresas',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadComponent: () => import('./features/admin/companies/companies.component').then(m => m.CompaniesComponent),
      },
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/admin/default/admin-default.component').then((m) => m.AdminDefaultComponent),
      },

      {
        path: ADMIN_ROUTES.USERS.PATH,
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadChildren: () =>
          import('./features/admin/users/user.route').then((m) => m.userRoutes),
      },

      {
        path: ADMIN_ROUTES.ROLES.PATH,
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadChildren: () =>
          import('./features/admin/roles/role.route').then((m) => m.roleRoutes),
      },

      {
        path: ADMIN_ROUTES.SETTINGS.PATH,
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/settings/pages/settings.page').then((m) => m.SettingsPageComponent),
      },
      {
        path: ADMIN_ROUTES.MODERATION.PATH,
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/moderation/moderation.component').then((m) => m.ModerationComponent),
      },
      {
        path: ADMIN_ROUTES.JOBS.PATH,
        loadChildren: () =>
          import('./features/company/company.route').then((m) => m.companyRoutes),
      },
    ],
  },

  { path: '', pathMatch: 'full', redirectTo: 'jobs' },
  { path: '**', redirectTo: 'jobs' },
];
