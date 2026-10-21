import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { PermissionService } from './permission.service';

export const roleGuard: CanActivateFn = (route) => {
  const permissions = inject(PermissionService);
  const router = inject(Router);
  const requiredRoles = (route.data?.['roles'] as string[] | undefined) ?? ['ROLE_ADMIN'];

  return permissions.ensureLoaded().pipe(
    map(() => {
      const has = requiredRoles.some((r) => permissions.hasAuthority(r));
      if (has) return true;
      router.navigate(['/admin']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
