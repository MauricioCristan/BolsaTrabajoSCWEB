import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobFormComponent } from './job-form.component';
import { JobService } from '../../../jobs/services/job.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { PermissionService } from '../../../../core/auth/permission.service';
import { CompanyService } from '../../services/company.service';

describe('JobFormComponent', () => {
  let fixture: ComponentFixture<JobFormComponent>;
  let component: JobFormComponent;

  const mockJobService = {
    get: vi.fn().mockReturnValue(of({ id: '1', titulo: 'Test', descripcion: 'd', categoria: 'General', tipoContrato: 'TIEMPO_COMPLETO', fechaCierre: '2099-12-31', status: 'PENDIENTE' })),
    create: vi.fn().mockReturnValue(of({})),
    update: vi.fn().mockReturnValue(of({})),
  };
  const mockNotifications = { success: vi.fn(), error: vi.fn() };
  const mockPermissions = { ensureLoaded: vi.fn().mockReturnValue(of(void 0)), hasAnyAdminRole: vi.fn().mockReturnValue(false) };
  const mockCompanyService = { list: vi.fn().mockReturnValue(of({ data: [{ id: 'company-1', nombre: 'Empresa', colonia: 'Centro', verificada: true }], total: 1 })) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobFormComponent],
      providers: [
        { provide: JobService, useValue: mockJobService },
        { provide: NotificationService, useValue: mockNotifications },
        { provide: PermissionService, useValue: mockPermissions },
        { provide: CompanyService, useValue: mockCompanyService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(JobFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('admin debe seleccionar empresa y se envía al crear la vacante', () => {
    mockPermissions.hasAnyAdminRole.mockReturnValue(true);
    component.ngOnInit();
    component.form.patchValue({ titulo: 'Operador', descripcion: 'Descripción', categoria: 'Industria', tipoContrato: 'TIEMPO_COMPLETO', calle: 'Av', numeroExterior: '1', colonia: 'Centro', fechaCierre: component.minFechaCierre, contactoEmail: 'rh@test.com' });
    mockJobService.create.mockClear();
    component.submit();
    expect(mockJobService.create).not.toHaveBeenCalled();
    component.form.controls.companyId.setValue('company-1');
    component.submit();
    expect(mockJobService.create).toHaveBeenCalledWith(expect.objectContaining({ company: { id: 'company-1' } }));
    mockPermissions.hasAnyAdminRole.mockReturnValue(false);
  });

  it('requiere campos obligatorios', () => {
    const f = component.form;
    f.patchValue({ titulo: '', descripcion: '', categoria: '', tipoContrato: '', calle: '', numeroExterior: '', colonia: '', fechaCierre: '' });
    expect(f.invalid).toBe(true);
    expect(f.controls.titulo.errors?.['required']).toBeTruthy();
    expect(f.controls.calle.errors?.['required']).toBeTruthy();
  });

  it('valida codigoPostal pattern', () => {
    const c = component.form.controls.codigoPostal;
    c.setValue('123'); fixture.detectChanges();
    expect(c.invalid).toBe(true);
    c.setValue('66350');
    expect(c.valid).toBe(true);
    c.setValue('');
    expect(c.valid).toBe(true); // opcional
  });

  it('valida email', () => {
    const c = component.form.controls.contactoEmail;
    c.setValue('no-email');
    expect(c.errors?.['email']).toBeTruthy();
    c.setValue('rh@test.com');
    expect(c.valid).toBe(true);
  });

  it('valida fechaCierre min mañana', () => {
    const c = component.form.controls.fechaCierre;
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
    c.setValue(ayer.toISOString().split('T')[0]);
    expect(c.errors?.['fechaMin']).toBeTruthy();
    const manana = new Date(); manana.setDate(manana.getDate() + 1);
    c.setValue(manana.toISOString().split('T')[0]);
    expect(c.valid).toBe(true);
  });

  it('valida sueldoMin no negativo y rango', () => {
    const f = component.form;
    f.patchValue({ titulo: 't', descripcion: 'd', categoria: 'General', tipoContrato: 'TIEMPO_COMPLETO', calle: 'c', numeroExterior: '1', colonia: 'Centro', fechaCierre: component.minFechaCierre, sueldoMin: -1, sueldoMax: 1000 });
    expect(f.controls.sueldoMin.errors?.['min']).toBeTruthy();
    f.patchValue({ sueldoMin: 15000, sueldoMax: 10000 });
    expect(f.errors?.['sueldoRange']).toBeTruthy();
    f.patchValue({ sueldoMin: 8000, sueldoMax: 12000 });
    expect(f.errors).toBeNull();
  });

  it('exige al menos un contacto en submit', async () => {
    const f = component.form;
    f.patchValue({
      titulo: 'Operador', descripcion: 'Desc', categoria: 'General', tipoContrato: 'TIEMPO_COMPLETO',
      calle: 'Av', numeroExterior: '1', colonia: 'Centro', fechaCierre: component.minFechaCierre,
      contactoEmail: '', contactoTel: '', contactoWhatsapp: ''
    });
    component.submit();
    expect(component.errorMsg).toContain('al menos un contacto');
  });

  it('minFechaCierre es mañana', () => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    expect(component.minFechaCierre).toBe(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  });
});
