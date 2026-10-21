import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModerationComponent } from './moderation.component';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/notifications/notification.service';
import { ConfirmationService } from '../../../core/confirmation/confirmation.service';
import { of } from 'rxjs';

describe('ModerationComponent', () => {
  let fixture: ComponentFixture<ModerationComponent>;
  let component: ModerationComponent;
  let httpMock: any;

  beforeEach(async () => {
    httpMock = {
      get: vi.fn().mockReturnValue(of({ data: [{ id: '1', nombre: 'Test SA', rfc: 'XAXX010101000', colonia: 'Centro' }], page: 1, total: 1 })),
      put: vi.fn().mockReturnValue(of({})),
    };
    await TestBed.configureTestingModule({
      imports: [ModerationComponent],
      providers: [
        { provide: HttpClient, useValue: httpMock },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: ConfirmationService, useValue: { confirm: vi.fn().mockResolvedValue(true) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ModerationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('load llena companies y jobs', () => {
    expect(httpMock.get).toHaveBeenCalledTimes(2);
    expect(component.companies.length).toBe(1);
  });

  it('totalPages calcula bien', () => {
    expect(component.totalPages(25, 10)).toBe(3);
    expect(component.totalPages(0, 10)).toBe(1);
  });

  it('direccionCompleta concatena', () => {
    const j = { calle: 'Av', numeroExterior: '120', numeroInterior: '4', colonia: 'Centro', codigoPostal: '66350' };
    expect(component.direccionCompleta(j)).toContain('Av 120');
    expect(component.direccionCompleta(j)).toContain('Int. 4');
    expect(component.direccionCompleta(j)).toContain('Centro');
  });

  it('verifyCompany publica con PUT', async () => {
    // mock prompt para rechazo
    vi.stubGlobal('prompt', vi.fn().mockReturnValue('motivo'));
    await component.verifyCompany('1', true);
    expect(httpMock.put).toHaveBeenCalledWith(expect.stringContaining('/Company/1'), { verificada: true, rejectionReason: null });
  });
});
