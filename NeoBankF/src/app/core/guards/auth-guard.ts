import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const session = inject(SessionService);

  if (session.isAuthenticated()) return true;

  session.clear();
  router.navigate(['/login']);
  return false;
};

export const roleGuard = (allowedRole: 'CUSTOMER' | 'ADMIN'): CanActivateFn => () => {
  const router = inject(Router);
  const session = inject(SessionService);

  if (!session.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const role = session.getRole();
  if (role === allowedRole) return true;

  router.navigate([role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard']);
  return false;
};