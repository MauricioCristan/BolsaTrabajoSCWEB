import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { JobService } from '../../../jobs/services/job.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ADMIN_ROUTES } from '../../../admin/admin-routes';
import { PermissionService } from '../../../../core/auth/permission.service';
import { CompanyService, CompanyRow } from '../../services/company.service';
import { localDate } from '../../../jobs/job-presentation';

@Component({
  standalone: true,
  selector: 'app-job-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './job-form.component.html',
})
export class JobFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly jobs = inject(JobService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly permissions = inject(PermissionService);
  private readonly companyService = inject(CompanyService);
  isAdmin = false;
  companies: CompanyRow[] = [];
  companyPage = 1;
  companyTotal = 0;
  companyQuery = '';
  loadingCompanies = false;

  searchCompanies(query: string, page = 1): void {
    this.companyQuery = query;
    this.loadingCompanies = true;
    this.companyService.list(page, query, 'true').subscribe({
      next: res => {
        this.companies = page === 1 ? res.data : [...this.companies, ...res.data];
        this.companyPage = page; this.companyTotal = res.total;
        this.loadingCompanies = false; this.cdr.detectChanges();
      },
      error: () => { this.loadingCompanies = false; this.errorMsg = 'No se pudieron cargar las empresas. Intenta buscar nuevamente.'; this.cdr.detectChanges(); }
    });
  }

  loading = false;
  saving = false;
  errorMsg: string | null = null;
  editId: string | null = null;
  currentStatus: string | null = null;

  form = this.fb.group({
    companyId: [''],
    titulo: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: ['', [Validators.required]],
    categoria: ['General', [Validators.required]],
    tipoContrato: ['TIEMPO_COMPLETO', [Validators.required]],
    sueldoMin: [null as number | null, [Validators.min(0)]],
    sueldoMax: [null as number | null, [Validators.min(0)]],
    calle: ['', [Validators.required, Validators.maxLength(150)]],
    numeroExterior: ['', [Validators.required, Validators.maxLength(10)]],
    numeroInterior: ['', [Validators.maxLength(10)]],
    colonia: ['', [Validators.required, Validators.maxLength(120)]],
    codigoPostal: ['', [Validators.pattern(/^\d{5}$/)]],
    referencias: [''],
    contactoEmail: ['', [Validators.email]],
    contactoTel: [''],
    contactoWhatsapp: [''],
    fechaCierre: ['', [Validators.required, this.fechaMinValidator()]],
  }, { validators: this.sueldoRangeValidator() });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.editId = id;
    this.permissions.ensureLoaded().subscribe({ next: () => {
      this.isAdmin = this.permissions.hasAnyAdminRole();
      if (this.isAdmin && !this.isEdit) {
        this.form.controls.companyId.addValidators(Validators.required);
        this.form.controls.companyId.updateValueAndValidity();
        this.searchCompanies('');
      }
      this.cdr.detectChanges();
    }, error: () => { this.errorMsg = 'No se pudieron comprobar tus permisos'; this.cdr.detectChanges(); } });
    if (id) {
      this.editId = id;
      this.loadJob(id);
    }
  }

  get isEdit(): boolean {
    return this.editId !== null;
  }

  get minFechaCierre(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return localDate(d);
  }

  private fechaMinValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      return control.value < this.minFechaCierre ? { fechaMin: 'La fecha debe ser al menos mañana' } : null;
    };
  }

  private sueldoRangeValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      const min = group.get('sueldoMin')?.value;
      const max = group.get('sueldoMax')?.value;
      if (min != null && max != null && min > max) return { sueldoRange: 'Sueldo min no puede ser mayor que max' };
      return null;
    };
  }

  loadJob(id: string): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.jobs.get(id).subscribe({
      next: (j) => {
        this.form.patchValue({
          titulo: j.titulo,
          descripcion: j.descripcion,
          categoria: j.categoria,
          tipoContrato: j.tipoContrato,
          sueldoMin: j.sueldoMin ?? null,
          sueldoMax: j.sueldoMax ?? null,
          calle: j.calle ?? '',
          numeroExterior: j.numeroExterior ?? '',
          numeroInterior: j.numeroInterior ?? '',
          referencias: j.referencias ?? '',
          colonia: j.colonia ?? '',
          codigoPostal: j.codigoPostal ?? '',
          contactoEmail: j.contactoEmail ?? '',
          contactoTel: j.contactoTel ?? '',
          contactoWhatsapp: j.contactoWhatsapp ?? '',
          fechaCierre: j.fechaCierre,
        });
        this.currentStatus = j.status;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'No se pudo cargar el empleo';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  submit(): void {
    this.errorMsg = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    if (!v.contactoEmail && !v.contactoTel && !v.contactoWhatsapp) {
      this.errorMsg = 'Debes proporcionar al menos un contacto (email, teléfono o WhatsApp)';
      this.cdr.detectChanges();
      return;
    }

    const payload = {
      ...(this.isAdmin && !this.isEdit ? { company: { id: v.companyId } } : {}),
      titulo: v.titulo!.trim(),
      descripcion: v.descripcion!.trim(),
      categoria: v.categoria!.trim(),
      tipoContrato: v.tipoContrato,
      sueldoMin: v.sueldoMin ?? null,
      sueldoMax: v.sueldoMax ?? null,
      calle: v.calle!.trim(),
      numeroExterior: v.numeroExterior!.trim(),
      numeroInterior: v.numeroInterior?.trim() || null,
      referencias: v.referencias?.trim() || null,
      colonia: v.colonia!.trim(),
      codigoPostal: v.codigoPostal?.trim() || null,
      contactoEmail: v.contactoEmail?.trim() || null,
      contactoTel: v.contactoTel?.trim() || null,
      contactoWhatsapp: v.contactoWhatsapp?.trim() || null,
      fechaCierre: v.fechaCierre,
    };

    this.saving = true;
    this.cdr.detectChanges();

    const request = this.isEdit
      ? this.jobs.update(this.editId!, payload)
      : this.jobs.create(payload);

    request
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.notifications.success(this.isEdit ? 'Empleo actualizado' : 'Empleo creado');
          this.router.navigate(ADMIN_ROUTES.JOBS.LIST.COMMANDS);
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || 'Error al guardar';
          this.notifications.error(err?.error?.message || 'Error al guardar');
          this.cdr.detectChanges();
        },
      });
  }

  cancel(): void {
    this.router.navigate(ADMIN_ROUTES.JOBS.LIST.COMMANDS);
  }
}
