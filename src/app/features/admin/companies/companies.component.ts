import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompanyService, CompanyRow } from '../../company/services/company.service';
import { NotificationService } from '../../../core/notifications/notification.service';

@Component({
  standalone: true,
  selector: 'app-companies',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './companies.component.html',
})
export class CompaniesComponent implements OnInit {
  private readonly service = inject(CompanyService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notifications = inject(NotificationService);
  rows: CompanyRow[] = [];
  page = 1; total = 0; q = ''; verified = '';
  loading = false; saving = false; error = '';
  draft: CompanyRow | null = null;
  get totalPages(): number { return Math.max(1, Math.ceil(this.total / 20)); }
  ngOnInit(): void { this.load(); }

  load(page = 1): void {
    this.loading = true; this.error = ''; this.cdr.detectChanges();
    this.service.list(page, this.q, this.verified).subscribe({
      next: res => { this.rows = res.data; this.total = res.total; this.page = res.page; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.error = 'No se pudieron cargar las empresas. Intenta nuevamente.'; this.cdr.detectChanges(); }
    });
  }
  edit(row: CompanyRow): void { this.draft = { ...row }; this.error = ''; }
  save(): void {
    if (!this.draft || this.saving) return;
    const { id, nombre, colonia, telefono, descripcion } = this.draft;
    if (!nombre.trim() || !colonia.trim()) { this.error = 'Nombre y colonia son obligatorios.'; return; }
    this.saving = true; this.error = '';
    this.service.update(id, { nombre: nombre.trim(), colonia: colonia.trim(), telefono: telefono?.trim(), descripcion }).subscribe({
      next: () => { this.saving = false; this.draft = null; this.notifications.success('Empresa actualizada'); this.load(this.page); },
      error: err => { this.saving = false; this.error = err?.error?.message || 'No se pudo guardar la empresa'; this.cdr.detectChanges(); }
    });
  }
}
