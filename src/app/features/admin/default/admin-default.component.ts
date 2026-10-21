import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { I18nPipe } from '../../../core/i18n/i18n.pipe';
import { ADMIN_ROUTES } from '../admin-routes';
import { environment } from '../../../../enviroment/environment';
import { localDate } from '../../jobs/job-presentation';

@Component({
  standalone: true,
  selector: 'app-admin-default',
  imports: [CommonModule, I18nPipe, RouterModule],
  templateUrl: './admin-default.component.html',
})
export class AdminDefaultComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly permissions = inject(PermissionService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  error = false;
  noAccess = false;
  isEmpresa = false;
  isAdmin = false;
  kpiError = false;
  readonly ADMIN_ROUTES = ADMIN_ROUTES;

  kpi = { empresasPendientes: 0, vacantesPendientes: 0, vacantesPublicadas: 0, vacantesVencidas: 0, loadingKpi: true };

  ngOnInit(): void {
    this.resolveLanding();
  }

  retry(): void {
    this.resolveLanding();
  }

  async logout(): Promise<void> {
    this.auth.logoutLocal();
    await this.router.navigate(['/login']);
  }

  private resolveLanding(): void {
    this.loading = true;
    this.error = false;
    this.noAccess = false;
    this.cdr.detectChanges();

    this.permissions.ensureLoaded().subscribe({
      next: async () => {
        this.isEmpresa = this.permissions.hasAuthority('ROLE_EMPRESA');
        this.isAdmin = this.permissions.hasAnyAdminRole();
        // EMPRESA se queda en dashboard con KPI propios; ADMIN también ve dashboard ahora
        if (this.isEmpresa || this.isAdmin) {
          this.loading = false;
          this.cdr.detectChanges();
          this.loadKpi();
          return;
        }
        if (this.permissions.canRead('USER')) {
          await this.router.navigate([...ADMIN_ROUTES.USERS.LIST.COMMANDS], { replaceUrl: true });
          return;
        }
        if (this.permissions.canRead('ROLE')) {
          await this.router.navigate([...ADMIN_ROUTES.ROLES.LIST.COMMANDS], { replaceUrl: true });
          return;
        }
        if (this.permissions.canRead('SETTING')) {
          await this.router.navigate([...ADMIN_ROUTES.SETTINGS.COMMANDS], { replaceUrl: true });
          return;
        }

        this.loading = false;
        this.noAccess = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      },
    });
  }

  private loadKpi(): void {
    this.kpiError = false;
    this.kpi.loadingKpi = true; this.cdr.detectChanges();
    const baseCompany = `${environment.apiBaseUrl}/backendless/Company/quick`;
    const baseJob = `${environment.apiBaseUrl}/backendless/JobOffer/quick`;
    const reqs: any = {
      empresasPendientes: this.http.get<any>(baseCompany, { params: new HttpParams().set('search','verificada=false').set('limit',1) }),
      vacantesPendientes: this.http.get<any>(baseJob, { params: new HttpParams().append('search','status=PENDIENTE').append('search', `fechaCierre>=${localDate()}`).set('limit',1) }),
      vacantesPublicadas: this.http.get<any>(baseJob, { params: new HttpParams().append('search','status=PUBLICADA').append('search', `fechaCierre>=${localDate()}`).set('limit',1) }),
      vacantesVencidas: this.http.get<any>(baseJob, { params: new HttpParams().set('search','status=VENCIDA').set('limit',1) }),
    };
    forkJoin(reqs).subscribe({
      next: (res: any) => {
        this.kpi.empresasPendientes = res.empresasPendientes?.total ?? 0;
        this.kpi.vacantesPendientes = res.vacantesPendientes?.total ?? 0;
        this.kpi.vacantesPublicadas = res.vacantesPublicadas?.total ?? 0;
        this.kpi.vacantesVencidas = res.vacantesVencidas?.total ?? 0;
        this.kpi.loadingKpi = false; this.cdr.detectChanges();
      },
      error: () => { this.kpiError = true; this.kpi.loadingKpi = false; this.cdr.detectChanges(); }
    });
  }
}
