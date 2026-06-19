import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../core/services/session.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const session = inject(SessionService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        session.clear();
        router.navigate(['/login'], { queryParams: { reason: 'expired' } });
      } else if (err.status === 403) {
        const role = session.getRole();
        const dest = role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard';
        router.navigate([dest]);
      }
      return throwError(() => err);
    })
  );
};
