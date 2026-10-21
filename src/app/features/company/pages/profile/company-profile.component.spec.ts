import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompanyProfileComponent } from './company-profile.component';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { of, throwError } from 'rxjs';

describe('CompanyProfileComponent', () => {
  let fixture: ComponentFixture<CompanyProfileComponent>;
  let component: CompanyProfileComponent;
  let httpMock: any;

  const mockCompany = {
    id: 'uuid-1', nombre: 'Test SA', rfc: 'XAXX010101000', colonia: 'Centro', telefono: '8112345678', descripcion: 'Desc', verificada: false, rejectionReason: null
  };

  beforeEach(async () => {
    httpMock = { get: vi.fn().mockReturnValue(of({ data: [mockCompany] })), put: vi.fn().mockReturnValue(of({})) };
    await TestBed.configureTestingModule({
      imports: [CompanyProfileComponent],
      providers: [
        { provide: HttpClient, useValue: httpMock },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CompanyProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load company', () => {
    expect(component).toBeTruthy();
    expect(httpMock.get).toHaveBeenCalled();
    expect(component.companyId).toBe('uuid-1');
    expect(component.rfc).toBe('XAXX010101000');
    expect(component.form.controls.nombre.value).toBe('Test SA');
  });

  it('requiere nombre y colonia', () => {
    component.form.patchValue({ nombre: '', colonia: '' });
    expect(component.form.invalid).toBe(true);
  });

  it('save envía PUT sin rfc', () => {
    component.form.patchValue({ nombre: 'Nuevo', colonia: 'Centro', telefono: '81', descripcion: 'd' });
    component.save();
    expect(httpMock.put).toHaveBeenCalledWith(expect.stringContaining('/backendless/Company/uuid-1'), { nombre: 'Nuevo', colonia: 'Centro', telefono: '81', descripcion: 'd' });
  });

  it('no guarda si form inválido', () => {
    component.form.patchValue({ nombre: '', colonia: '' });
    component.save();
    expect(httpMock.put).not.toHaveBeenCalled();
  });

  it('muestra error si GET falla', async () => {
    httpMock.get.mockReturnValueOnce(throwError(() => ({ error: { message: 'fail' } })));
    component.reload();
    // espera microtask
    await fixture.whenStable();
    expect(component.errorMsg).toBeTruthy();
  });
});
