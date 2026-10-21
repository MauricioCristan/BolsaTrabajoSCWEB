import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from '../../../../../enviroment/environment';
import { NotificationService } from '../../../../core/notifications/notification.service';

@Component({
  standalone: true,
  selector: 'app-company-profile',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="d-flex align-items-center justify-content-between mb-3">
    <div>
      <h4 class="mb-0">Mi empresa</h4>
      <small class="text-muted">Actualiza los datos de tu empresa. El RFC no se puede modificar.</small>
    </div>
    <span *ngIf="verificada !== null" class="badge" [ngClass]="verificada ? 'bg-success' : 'bg-warning text-dark'">{{verificada ? 'Verificada' : 'Pendiente verificación'}}</span>
  </div>

  @if (loading) {
    <div class="card"><div class="card-body text-center py-5"><span class="spinner-border"></span></div></div>
  } @else if (errorMsg && !companyId) {
    <div class="alert alert-danger">{{errorMsg}}</div>
  } @else {
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="save()" class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Nombre *</label>
            <input class="form-control" formControlName="nombre" />
            @if (form.controls.nombre.invalid && form.controls.nombre.touched) { <small class="text-danger">Requerido máx 120</small> }
          </div>
          <div class="col-md-3">
            <label class="form-label">RFC</label>
            <input class="form-control" [value]="rfc" disabled />
            <small class="text-muted">No editable</small>
          </div>
          <div class="col-md-3">
            <label class="form-label">Colonia *</label>
            <input class="form-control" formControlName="colonia" />
            @if (form.controls.colonia.invalid && form.controls.colonia.touched) { <small class="text-danger">Requerida</small> }
          </div>
          <div class="col-md-3">
            <label class="form-label">Teléfono</label>
            <input class="form-control" formControlName="telefono" />
          </div>
          <div class="col-12">
            <label class="form-label">Descripción</label>
            <textarea class="form-control" formControlName="descripcion" rows="3"></textarea>
          </div>
          @if (rejectionReason) { <div class="col-12"><div class="alert alert-warning mb-0">Motivo de rechazo: {{rejectionReason}}</div></div> }
          @if (errorMsg) { <div class="col-12"><div class="alert alert-danger mb-0">{{errorMsg}}</div></div> }
          <div class="col-12 d-flex gap-2">
            <button type="submit" class="btn text-white" style="background:#7A0C10;" [disabled]="saving">@if(saving){<span class="spinner-border spinner-border-sm me-2"></span>}Guardar</button>
            <button type="button" class="btn btn-outline-secondary" (click)="reload()" [disabled]="saving">Recargar</button>
          </div>
        </form>
      </div>
    </div>
  }
  `,
})
export class CompanyProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly notifications = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  saving = false;
  errorMsg: string | null = null;
  companyId: string | null = null;
  rfc = '';
  verificada: boolean | null = null;
  rejectionReason: string | null = null;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    colonia: ['', [Validators.required]],
    telefono: [''],
    descripcion: [''],
  });

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.loading = true; this.errorMsg = null; this.cdr.detectChanges();
    this.http.get<any>(`${environment.apiBaseUrl}/backendless/Company/quick?limit=1`).subscribe({
      next: res => {
        const c = res.data?.[0];
        if (!c) { this.errorMsg = 'No se encontró tu empresa'; this.loading = false; this.cdr.detectChanges(); return; }
        this.companyId = c.id;
        this.rfc = c.rfc;
        this.verificada = c.verificada;
        this.rejectionReason = c.rejectionReason || null;
        this.form.patchValue({ nombre: c.nombre, colonia: c.colonia, telefono: c.telefono || '', descripcion: c.descripcion || '' });
        this.loading = false; this.cdr.detectChanges();
      },
      error: err => { this.errorMsg = err?.error?.message || 'Error al cargar empresa'; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  save(): void {
    if (this.form.invalid || !this.companyId) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.errorMsg = null; this.cdr.detectChanges();
    const v = this.form.value;
    const payload: any = { nombre: v.nombre!.trim(), colonia: v.colonia!.trim(), telefono: v.telefono?.trim() || null, descripcion: v.descripcion?.trim() || null };
    this.http.put<any>(`${environment.apiBaseUrl}/backendless/Company/${this.companyId}`, payload).pipe(finalize(() => { this.saving = false; this.cdr.detectChanges(); })).subscribe({
      next: () => { this.notifications.success('Empresa actualizada'); },
      error: err => { this.errorMsg = err?.error?.message || 'Error al guardar'; this.notifications.error(this.errorMsg!); this.cdr.detectChanges(); }
    });
  }
}
