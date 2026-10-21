import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { CompanyService } from '../../company/services/company.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { I18nPipe } from '../../../core/i18n/i18n.pipe';

@Component({
  standalone: true,
  selector: 'app-register-company',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, I18nPipe],
  templateUrl: './register-company.component.html',
})
export class RegisterCompanyComponent {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  loading = false;
  errorMsg: string | null = null;

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    email: ['', [Validators.email]],
    nombre: ['', [Validators.required]],
    rfc: ['', [Validators.required, Validators.pattern(/^[A-Z]{3,4}[0-9]{6}[A-Z0-9]{3}$/)]],
    colonia: ['', [Validators.required]],
    telefono: [''],
    descripcion: [''],
  });

  submit(): void {
    this.errorMsg = null;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const v = this.form.value;
    this.companyService.register({
      username: v.username!.trim(),
      password: v.password!,
      email: v.email?.trim() || undefined,
      nombre: v.nombre!.trim(),
      rfc: v.rfc!.trim().toUpperCase(),
      colonia: v.colonia!.trim(),
      telefono: v.telefono?.trim() || undefined,
      descripcion: v.descripcion?.trim() || undefined,
    }).pipe(finalize(() => this.loading = false)).subscribe({
      next: async () => {
        this.notifications.success({ key: 'Empresa registrada, pendiente de verificación' } as any);
        await this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Error al registrar empresa';
        this.notifications.error(this.errorMsg || 'Error');
      }
    });
  }
}
