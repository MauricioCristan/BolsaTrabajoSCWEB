import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../enviroment/environment';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmationService } from '../../../core/confirmation/confirmation.service';
import { contractLabel, salaryLabel, isExpired } from '../../jobs/job-presentation';

@Component({
  standalone: true,
  selector: 'app-moderation',
  imports: [CommonModule, FormsModule],
  templateUrl: './moderation.component.html',
})
export class ModerationComponent implements OnInit {
  readonly contractLabel = contractLabel;
  readonly salaryLabel = salaryLabel;
  readonly isExpired = isExpired;
  companyError = '';
  jobError = '';
  private readonly http = inject(HttpClient);
  private readonly notifications = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);

  companies: any[] = [];
  jobs: any[] = [];
  loading = false;

  // paginación
  companyPage = { page: 1, limit: 10, total: 0 };
  jobPage = { page: 1, limit: 10, total: 0 };

  // motivo rechazo
  rejectionReasonCompany = '';
  rejectionReasonJob = '';
  processingId: string | null = null;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loadCompanies(1);
    this.loadJobs(1);
  }

  loadCompanies(page = this.companyPage.page): void {
    this.companyError = '';
    this.loading = true;
    this.cdr.detectChanges();
    let params = new HttpParams().set('search', 'verificada=false').set('page', page).set('limit', this.companyPage.limit);
    this.http.get<any>(`${environment.apiBaseUrl}/backendless/Company/quick`, { params }).subscribe({
      next: res => {
        this.companies = res.data || [];
        this.companyPage.page = res.page || page;
        this.companyPage.total = res.total || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.companyError = 'No se pudieron cargar las empresas. Vuelve a intentar.'; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadJobs(page = this.jobPage.page): void {
    this.jobError = '';
    this.loading = true;
    this.cdr.detectChanges();
    let params = new HttpParams().set('search', 'status=PENDIENTE').set('page', page).set('limit', this.jobPage.limit);
    this.http.get<any>(`${environment.apiBaseUrl}/backendless/JobOffer/quick`, { params }).subscribe({
      next: res => {
        this.jobs = res.data || [];
        this.jobPage.page = res.page || page;
        this.jobPage.total = res.total || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.jobError = 'No se pudieron cargar las vacantes. Vuelve a intentar.'; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  async verifyCompany(id: string, verificada: boolean): Promise<void> {
    if (this.processingId) return;
    let rejectionReason: string | null = null;
    if (!verificada) {
      const input = window.prompt('Motivo de rechazo (requerido):', this.rejectionReasonCompany || 'No cumple requisitos municipio');
      if (input === null) return; // canceló
      if (!input.trim()) {
        this.notifications.error('El motivo de rechazo es requerido');
        return;
      }
      rejectionReason = input.trim();
    }
    const ok = await this.confirmation.confirm({
      title: verificada ? 'Verificar empresa' : 'Rechazar empresa',
      message: verificada ? '¿Verificar esta empresa?' : `¿Rechazar con motivo: "${rejectionReason}"?`,
      confirmClass: verificada ? 'btn-success' : 'btn-danger',
    });
    if (!ok) return;
    this.processingId = id;
    const body: any = { verificada, rejectionReason };
    this.http.put<any>(`${environment.apiBaseUrl}/backendless/Company/${id}`, body).subscribe({
      next: () => { this.notifications.success(verificada ? 'Empresa verificada' : 'Empresa rechazada'); this.processingId = null; this.loadCompanies(); },
      error: err => { this.notifications.error(err?.error?.message || 'Error'); this.processingId = null; this.cdr.detectChanges(); }
    });
  }

  async publishJob(id: string, status: string): Promise<void> {
    if (this.processingId) return;
    const job = this.jobs.find(j => j.id === id);
    if (status === 'PUBLICADA' && job && isExpired(job.fechaCierre)) {
      this.notifications.error('La vacante está vencida. Actualiza la fecha de cierre antes de publicarla.');
      return;
    }
    let rejectionReason: string | null = null;
    if (status === 'RECHAZADA') {
      const input = window.prompt('Motivo de rechazo de vacante:', this.rejectionReasonJob || 'No cumple requisitos municipio');
      if (input === null) return;
      if (!input.trim()) { this.notifications.error('El motivo es requerido para rechazar'); return; }
      rejectionReason = input.trim();
    }
    const ok = await this.confirmation.confirm({
      title: status === 'PUBLICADA' ? 'Publicar vacante' : 'Rechazar vacante',
      message: status === 'PUBLICADA' ? '¿Publicar esta vacante?' : `¿Rechazar con motivo: "${rejectionReason}"?`,
      confirmClass: status === 'PUBLICADA' ? 'btn-success' : 'btn-danger',
    });
    if (!ok) return;
    this.processingId = id;
    const body: any = status === 'RECHAZADA' ? { status, rejectionReason } : { status };
    this.http.put<any>(`${environment.apiBaseUrl}/backendless/JobOffer/${id}`, body).subscribe({
      next: () => { this.notifications.success(`Vacante ${status}`); this.processingId = null; this.loadJobs(); },
      error: err => { this.notifications.error(err?.error?.message || 'Error'); this.processingId = null; this.cdr.detectChanges(); }
    });
  }

  get direccionCompleta(): (j: any) => string {
    return (j: any) => {
      if (!j) return '';
      const partes: string[] = [];
      if (j.calle) { let d = `${j.calle} ${j.numeroExterior || 'S/N'}`; if (j.numeroInterior) d += ` Int. ${String(j.numeroInterior).replace(/^int\.?\s*/i, '')}`; partes.push(d); }
      if (j.colonia) partes.push(`Col. ${j.colonia}`);
      if (j.codigoPostal) partes.push(`C.P. ${j.codigoPostal}`);
      return partes.join(', ');
    };
  }

  totalPages(total: number, limit: number): number { return Math.max(1, Math.ceil((total||0)/(limit||10))); }
}
