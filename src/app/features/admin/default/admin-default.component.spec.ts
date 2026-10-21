import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDefaultComponent } from './admin-default.component';
import { PermissionService } from '../../../core/auth/permission.service';
import { AuthService } from '../../../core/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('AdminDefaultComponent', () => {
  let fixture: ComponentFixture<AdminDefaultComponent>;
  let component: AdminDefaultComponent;
  let perm: any;

  beforeEach(async () => {
    perm = {
      ensureLoaded: vi.fn().mockReturnValue(of(void 0)),
      hasAuthority: vi.fn().mockReturnValue(false),
      hasAnyAdminRole: vi.fn().mockReturnValue(false),
      canRead: vi.fn().mockReturnValue(false),
    };
    await TestBed.configureTestingModule({
      imports: [AdminDefaultComponent],
      providers: [
        { provide: PermissionService, useValue: perm },
        { provide: AuthService, useValue: { logoutLocal: vi.fn() } },
        { provide: HttpClient, useValue: { get: vi.fn().mockReturnValue(of({ total: 5, data: [] })) } },
        provideRouter([]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AdminDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('detecta empresa y admin', async () => {
    perm.hasAuthority.mockImplementation((a: string) => a === 'ROLE_EMPRESA');
    perm.hasAnyAdminRole.mockReturnValue(false);
    component['resolveLanding']();
    await fixture.whenStable();
    expect(component.isEmpresa).toBe(true);
  });

  it('kpi loading cambia tras forkJoin', async () => {
    perm.hasAuthority.mockReturnValue(true);
    perm.hasAnyAdminRole.mockReturnValue(true);
    component['loadKpi']();
    await fixture.whenStable();
    expect(component.kpi.loadingKpi).toBe(false);
  });
});
