import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { roleGuard } from './role.guard';
import { PermissionService } from './permission.service';

describe('roleGuard', () => {
  let permSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    permSpy = { ensureLoaded: vi.fn().mockReturnValue(of(void 0)), hasAuthority: vi.fn() };
    routerSpy = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        { provide: PermissionService, useValue: permSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('permite si tiene ROLE_ADMIN', async () => {
    permSpy.hasAuthority.mockReturnValue(true);
    const result = await TestBed.runInInjectionContext(() => roleGuard({ data: { roles: ['ROLE_ADMIN'] } } as any, {} as any)) as any;
    const val = await result.toPromise?.() ?? await new Promise(res => (result as any).subscribe(res));
    expect(val).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('bloquea y redirige a /admin si no tiene rol', async () => {
    permSpy.hasAuthority.mockReturnValue(false);
    const obs: any = TestBed.runInInjectionContext(() => roleGuard({ data: { roles: ['ROLE_ADMIN'] } } as any, {} as any));
    const val = await new Promise<boolean>(res => obs.subscribe((v: boolean) => res(v)));
    expect(val).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('usa ROLE_ADMIN por defecto si no hay data', async () => {
    permSpy.hasAuthority.mockReturnValue(true);
    const obs: any = TestBed.runInInjectionContext(() => roleGuard({ data: {} } as any, {} as any));
    const val = await new Promise<boolean>(res => obs.subscribe((v: boolean) => res(v)));
    expect(permSpy.hasAuthority).toHaveBeenCalledWith('ROLE_ADMIN');
    expect(val).toBe(true);
  });

  it('redirige a /login si ensureLoaded falla', async () => {
    permSpy.ensureLoaded.mockReturnValue(throwError(() => new Error('fail')));
    const obs: any = TestBed.runInInjectionContext(() => roleGuard({ data: { roles: ['ROLE_ADMIN'] } } as any, {} as any));
    const val = await new Promise<boolean>(res => obs.subscribe((v: boolean) => res(v)));
    expect(val).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
