import { Routes } from '@angular/router';
import { ADMIN_ROUTES } from '../admin/admin-routes';
import { CompanyComponent } from './company.component';

export const companyRoutes: Routes = [
  {
    path: '',
    component: CompanyComponent,
    children: [
      {
        path: ADMIN_ROUTES.JOBS.LIST.PATH,
        loadComponent: () => import('./pages/list/job-admin-list.component').then((m) => m.JobAdminListComponent),
      },
      {
        path: ADMIN_ROUTES.JOBS.CREATE.PATH,
        loadComponent: () => import('./pages/form/job-form.component').then((m) => m.JobFormComponent),
      },
      {
        path: ADMIN_ROUTES.JOBS.EDIT.PATH,
        loadComponent: () => import('./pages/form/job-form.component').then((m) => m.JobFormComponent),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/profile/company-profile.component').then((m) => m.CompanyProfileComponent),
      },
    ],
  },
];

export default companyRoutes;
