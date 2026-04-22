import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const TOKEN_KEY = 'bcms_token';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY);
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('bcms_user');
        if (router.url !== '/login') router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
