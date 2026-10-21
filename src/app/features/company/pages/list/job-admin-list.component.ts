import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { JobService, JobOfferRow } from '../../../jobs/services/job.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { ConfirmationService } from '../../../../core/confirmation/confirmation.service';
import { ADMIN_ROUTES } from '../../../admin/admin-routes';
import { contractLabel, salaryLabel } from '../../../jobs/job-presentation';

type SortDir = 'asc' | 'desc';
type SortField = 'titulo' | 'categoria' | 'status' | 'fechaCierre' | 'createdAt';

@Component({
  standalone: true,
  selector: 'app-job-admin-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './job-admin-list.component.html',
})
export class JobAdminListComponent implements OnInit {
  readonly contractLabel = contractLabel;
  readonly salaryLabel = salaryLabel;
  isAdmin = false;
  private readonly jobs = inject(JobService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notifications = inject(NotificationService);
  private readonly permissions = inject(PermissionService);
  private readonly confirmation = inject(ConfirmationService);

  loading = false;
  backendError: string | null = null;
  deletingId: string | null = null;

  canCreate = false;
  canUpdate = false;
  canDelete = false;

  query = {
    q: '',
    categoria: '',
    status: '' as '' | 'PENDIENTE' | 'PUBLICADA' | 'RECHAZADA' | 'VENCIDA' | 'CERRADA',
  };

  pageData = {
    data: [] as JobOfferRow[],
    page: 1,
    limit: 10,
    total: 0,
  };

  sort: { field: SortField; dir: SortDir } = { field: 'createdAt', dir: 'desc' };

  ngOnInit(): void {
    this.permissions.ensureLoaded().subscribe({
      next: () => {
        this.isAdmin = this.permissions.hasAnyAdminRole();
        this.canCreate = this.permissions.canCreate('JobOffer');
        this.canUpdate = this.permissions.canUpdate('JobOffer');
        this.canDelete = this.permissions.canDelete('JobOffer');
        this.load();
      },
      error: () => this.load(),
    });
  }

  load(page = this.pageData.page): void {
    this.loading = true;
    this.backendError = null;
    this.cdr.detectChanges();

    const search: string[] = [];
    if (this.query.categoria.trim()) search.push(`categoria=${this.query.categoria.trim()}`);
    if (this.query.status) search.push(`status=${this.query.status}`);

    this.jobs
      .list({
        page,
        limit: this.pageData.limit,
        search,
        order: this.orderParam,
        q: this.query.q.trim() || undefined,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.pageData.page = res.page;
          this.pageData.limit = res.limit;
          this.pageData.total = res.total;
          this.pageData.data = res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.backendError = err?.error?.message || 'Error al cargar empleos';
          this.cdr.detectChanges();
        },
      });
  }

  get orderParam(): string {
    return `${this.sort.field}:${this.sort.dir}`;
  }

  toggleSort(field: SortField): void {
    if (this.sort.field === field) {
      this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort.field = field;
      this.sort.dir = 'asc';
    }
    this.pageData.page = 1;
    this.load(1);
  }

  sortIcon(field: SortField): string {
    if (!this.isSortedBy(field)) return 'bi bi-arrow-down-up';
    return this.sort.dir === 'asc' ? 'bi bi-sort-up' : 'bi bi-sort-down';
  }

  isSortedBy(field: SortField): boolean {
    return this.sort.field === field;
  }

  onSearch(): void {
    this.pageData.page = 1;
    this.load(1);
  }

  clearSearch(): void {
    this.query.q = '';
    this.query.categoria = '';
    this.query.status = '';
    this.onSearch();
  }

  create(): void {
    if (!this.canCreate) return;
    this.router.navigate(ADMIN_ROUTES.JOBS.CREATE.COMMANDS);
  }

  edit(id: string): void {
    if (!this.canUpdate) return;
    this.router.navigate(ADMIN_ROUTES.JOBS.EDIT.commands(id));
  }

  async remove(id: string): Promise<void> {
    if (!this.canDelete || this.deletingId) return;

    const ok = await this.confirmation.confirm({
      title: 'Eliminar empleo',
      message: '¿Seguro que deseas eliminar esta vacante? Esta acción no se puede deshacer.',
      confirmClass: 'btn-danger',
    });
    if (!ok) return;

    this.deletingId = id;
    this.cdr.detectChanges();

    this.jobs
      .delete(id)
      .pipe(
        finalize(() => {
          this.deletingId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.notifications.success('Empleo eliminado');
          this.load();
        },
        error: (err) => {
          this.backendError = err?.error?.message || 'Error al eliminar';
          this.notifications.error(err?.error?.message || 'Error al eliminar');
          this.cdr.detectChanges();
        },
      });
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'PUBLICADA': return 'bg-success';
      case 'PENDIENTE': return 'bg-warning text-dark';
      case 'RECHAZADA': return 'bg-danger';
      case 'VENCIDA': return 'bg-secondary';
      case 'CERRADA': return 'bg-dark';
      default: return 'bg-light text-dark';
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil((this.pageData.total || 0) / (this.pageData.limit || 10)));
  }

  prev(): void {
    if (this.pageData.page <= 1) return;
    this.load(this.pageData.page - 1);
  }

  next(): void {
    if (this.pageData.page >= this.totalPages) return;
    this.load(this.pageData.page + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.pageData.page) return;
    this.load(page);
  }

  exporting = false;

  exportCsv(): void {
    this.exporting = true;
    this.cdr.detectChanges();
    const search: string[] = [];
    if (this.query.categoria.trim()) search.push(`categoria=${this.query.categoria.trim()}`);
    if (this.query.status) search.push(`status=${this.query.status}`);
    this.jobs.list({ page: 1, limit: 500, search, order: this.orderParam, q: this.query.q.trim() || undefined }).subscribe({
      next: res => {
        const rows = res.data || [];
        if (rows.length === 0) { this.notifications.error('No hay datos para exportar'); this.exporting = false; this.cdr.detectChanges(); return; }
        const headers = ['titulo','categoria','tipoContrato','sueldoMin','sueldoMax','colonia','codigoPostal','calle','numeroExterior','status','fechaCierre','contactoEmail','contactoTel'];
        const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => {
          const v = (r as any)[h];
          const s = v == null ? '' : String(v).replace(/"/g, '""');
          return `"${s}"`;
        }).join(','))).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `empleos_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
        this.notifications.success(`Exportados ${rows.length} empleos`);
        this.exporting = false; this.cdr.detectChanges();
      },
      error: err => { this.notifications.error(err?.error?.message || 'Error al exportar'); this.exporting = false; this.cdr.detectChanges(); }
    });
  }

  trackById(_: number, item: JobOfferRow): string {
    return item.id;
  }
}
